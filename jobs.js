// external dependencies
var express = require('express')
var config = require("config")
var fs = require('fs')
var passwordHash = require('password-hash')
var moment = require('moment')
var temporal = require('temporal')
var request = require('request')

// internal dependencies
var routeUtils = require('./app/routes/routeUtils')
var utils = require('./app/utils/index')
var models = require('./app/models/index')
var helpers = require('./app/helpers')
var service = require ('./app/service')
require('./app/startup/db')

function updatePassWord() {
  utils.async.waterfall(
    [
      function(callback) {
        models.user.getAll(callback)
      },
      function(users, callback) {
        utils.async.map(users, function(user, callback){
            if(!passwordHash.isHashed(user.passWord)) {
              user.passWord = passwordHash.generate(user.passWord)
              models.user.save(user, callback)
            }else {
              callback(null, user)
            }
        }, callback)
      }
    ],
    function(err, users) {
      utils.l.i("ADMIN : all passwords hashed All  done, exec users=", users)
      process.exit(0)
    }
  )

}

function deleteOldFullEvents() {
  utils.async.waterfall([
    function (callback) {
      var date = new Date()
      models.event.getByQuery({ "status":"full", launchDate:{ $lt: date }}, null, callback)
    },
    function (events, callback) {
      utils._.forEach(events, function(event) {
        utils.l.i("job archiving event: ", event)
        models.archiveEvent.createArchiveEvent(event, callback)
        utils.l.i("job removing event: ", event)
        event.remove(callback)
      })
    }
  ],
  function (err, event) {
    if (err) {
      utils.l.i("job unable to remove event due to: ", err)
    } else {
      utils.l.i("job removed events succesfully")
    }
  })
}

function deleteOldStaleEvents() {
  utils.async.waterfall([
      function (callback) {
        models.event.getByQuery({ launchStatus: "now"}, null, callback)
      },
      function(events, callback) {
        var currentTime = new Date(moment.tz(Date.now(), 'America/Los_Angeles').format())
        utils._.forEach(events, function(event) {
          var launchDate = new Date(moment.tz(event.launchDate, 'America/Los_Angeles').format())
          if(utils.format.compareDates(currentTime, launchDate) > 0) {
            utils.l.i("job archiving event: ", event)
            models.archiveEvent.createArchiveEvent(event, callback)
            utils.l.i("job removing event: ", event)
            event.remove(callback)
          }
        })
      },
    ],
    function (err, event) {
      if (err) {
        utils.l.i("job unable to remove event due to: ", err)
      } else {
        utils.l.i("job removed events succesfully")
      }
    })
}

function upcomingEventsReminder() {
  utils.async.waterfall([
      function (callback) {
        models.notificationTrigger.getByQuery({
          type: 'schedule',
          triggerName: utils.constants.eventNotificationTrigger.launchUpcomingEvents,
          isActive: true
        },
          utils.firstInArrayCallback(callback))
      },
      function(notifTrigger, callback) {
        if(!notifTrigger) {
          return callback({error: "Trigger for upcomingEventsReminder not found or is not active"}, null)
        }
        var stopTime = moment().add(9, 'minutes')
        var minsToSleep = 1

        service.eventNotificationTriggerService.handleUpcomingEvents(notifTrigger)
        temporal.loop(minsToSleep * 60 * 1000, function() {
          service.eventNotificationTriggerService.handleUpcomingEvents(notifTrigger)
          if(moment() > stopTime) {
            this.stop()
            return callback(null, null)
          }
        })

        // If temporal is too CPU intensive we can use this logic
        /*
        service.eventNotificationTriggerService.handleUpcomingEvents(notifTrigger)
        callHandleUpcomingEvents(notifTrigger, stopTime, callback)
        */
      }
    ],
    function (err, events) {
      if (err) {
        utils.l.s("Error sending upcomingEventsReminder notification::" + JSON.stringify(err) + "::" + JSON.stringify(events))
      } else {
        utils.l.i("upcomingEventsReminder was successful")
      }
    })
}

/*
function callHandleUpcomingEvents(notifTrigger,stopTime, callback) {
  setTimeout(function() {
    service.eventNotificationTriggerService.handleUpcomingEvents(notifTrigger)
      if(moment() < stopTime) {
        callHandleUpcomingEvents(notifTrigger, stopTime, callback)
      } else {
        return callback(null, null)
      }
  }, 60000)
}
*/

function eventFullReminder() {
  utils.async.waterfall([
      function (callback) {
        models.notificationTrigger.getByQuery({
            type: 'schedule',
            triggerName: utils.constants.eventNotificationTrigger.launchEventStart,
            isActive: true
          },
          utils.firstInArrayCallback(callback))
      },
      function(notifTrigger, callback) {
        if(!notifTrigger) {
          return callback({error: "Trigger for eventFullReminder not found or is not active"}, null)
        }
        var stopTime = moment().add(8, 'minutes')
        var minsToSleep = 2

        service.eventNotificationTriggerService.launchEventStart(notifTrigger)
        temporal.loop(minsToSleep * 60 * 1000, function() {
          service.eventNotificationTriggerService.launchEventStart(notifTrigger)
          if(moment() > stopTime) {
            this.stop()
            return callback(null, null)
          }
        })
      }
    ],
    function (err, events) {
      if (err) {
        utils.l.s("Error sending eventFullReminder notification::" + JSON.stringify(err) + "::" + JSON.stringify(events))
      } else {
        utils.l.i("eventFullReminder was successful")
      }
    })
}

function eventStartReminder() {
  utils.async.waterfall([
      function (callback) {
        models.notificationTrigger.getByQuery({
            type: 'schedule',
            triggerName: utils.constants.eventNotificationTrigger.eventStartReminder,
            isActive: true
          },
          utils.firstInArrayCallback(callback))
      },
      function(notifTrigger, callback) {
        if(!notifTrigger) {
          return callback({error: "Trigger for eventStartReminder not found or is not active"}, null)
        }
        var stopTime = moment().add(8, 'minutes')
        var minsToSleep = 2

        service.eventNotificationTriggerService.eventStartReminder(notifTrigger)
        temporal.loop(minsToSleep * 60 * 1000, function() {
          service.eventNotificationTriggerService.eventStartReminder(notifTrigger)
          if(moment() > stopTime) {
            this.stop()
            return callback(null, null)
          }
        })
      }
    ],
    function (err, events) {
      if (err) {
        utils.l.s("Error sending eventStartReminder notification::" + JSON.stringify(err) + "::" + JSON.stringify(events))
      } else {
        utils.l.i("eventStartReminder was successful")
      }
    })
}

function eventExpiry() {
  var sysConfigObj = null
  utils.async.waterfall([
      function(callback){
        models.sysConfig.getSysConfig(utils.constants.sysConfigKeys.eventExpiryTimeInMins,callback)
      },
      function (sysConfig,callback) {
        sysConfigObj = sysConfig
        models.notificationTrigger.getByQuery({
            type: 'schedule',
            triggerName: utils.constants.eventNotificationTrigger.eventExpiry,
            isActive: true
          },
          utils.firstInArrayCallback(callback))
      },
      function(notifTrigger, callback) {
        if(!notifTrigger) {
          return callback({error: "Trigger for eventExpiry not found or is not active"}, null)
        }
        var stopTime = moment().add(8, 'minutes')
        var minsToSleep = 2

        service.eventService.expireEvents(notifTrigger,sysConfigObj)
        temporal.loop(minsToSleep * 60 * 1000, function() {
          service.eventService.expireEvents(notifTrigger,sysConfigObj)
          if(moment() > stopTime) {
            this.stop()
            return callback(null, null)
          }
        })
      }
    ],
    function (err, events) {
      if (err) {
        utils.l.s("Error sending eventExpiry notification::" + JSON.stringify(err) + "::" + JSON.stringify(events))
      } else {
        utils.l.i("eventExpiry was successful")
      }
    })
}

function userTimeout() {
  var sysConfigObj = null;
  utils.async.waterfall([
      function(callback){
        models.sysConfig.getSysConfig(utils.constants.sysConfigKeys.userTimeoutInMins,callback)
      },
      function (sysConfig,callback) {
        sysConfigObj = sysConfig
        models.notificationTrigger.getByQuery({
            type: 'schedule',
            triggerName: utils.constants.eventNotificationTrigger.userTimeout,
            isActive: true
          },
          utils.firstInArrayCallback(callback))
      },
      function(notifTrigger, callback) {
        if(!notifTrigger) {
          return callback({error: "Trigger for userTimeout not found or is not active"}, null)
        }
        var stopTime = moment().add(8, 'minutes')
        var minsToSleep = 2

        service.userService.userTimeout(notifTrigger,sysConfigObj)
        temporal.loop(minsToSleep * 60 * 1000, function() {
          service.userService.userTimeout(notifTrigger,sysConfigObj)
          if(moment() > stopTime) {
            this.stop()
            return callback(null, null)
          }
        })
      }
    ],
    function (err, events) {
      if (err) {
        utils.l.s("Error sending userTimeout notification::" + JSON.stringify(err) + "::" + JSON.stringify(events))
      } else {
        utils.l.i("userTimeout was successful")
      }
    })
}

function preUserTimeout() {
  var sysConfigObj = null;
  utils.async.waterfall([
      function(callback){
        models.sysConfig.getSysConfigList([utils.constants.sysConfigKeys.userTimeoutInMins,
          utils.constants.sysConfigKeys.preUserTimeoutInMins],callback)
      },
      function (sysConfig,callback) {
        sysConfigObj = sysConfig
        models.notificationTrigger.getByQuery({
            type: 'schedule',
            triggerName: utils.constants.eventNotificationTrigger.preUserTimeout,
            isActive: true
          },
          utils.firstInArrayCallback(callback))
      },
      function(notifTrigger, callback) {
        if(!notifTrigger) {
          return callback({error: "Trigger for preUserTimeout not found or is not active"}, null)
        }
        var stopTime = moment().add(8, 'minutes')
        var minsToSleep = 2

        service.userService.preUserTimeout(notifTrigger,sysConfigObj)
        temporal.loop(minsToSleep * 60 * 1000, function() {
          service.userService.preUserTimeout(notifTrigger,sysConfigObj)
          if(moment() > stopTime) {
            this.stop()
            return callback(null, null)
          }
        })
      }
    ],
    function (err, events) {
      if (err) {
        utils.l.s("Error sending preUserTimeout notification::" + JSON.stringify(err) + "::" + JSON.stringify(events))
      } else {
        utils.l.i("preUserTimeout was successful")
      }
    })
}

function dailyOneTimeReminder() {
  utils.async.waterfall([
    function (callback) {
      models.notificationTrigger.getByQuery({
        type: 'schedule',
        triggerName: utils.constants.eventNotificationTrigger.dailyOneTimeReminder,
        isActive: true
      },
        utils.firstInArrayCallback(callback))
    },
    function(notifTrigger, callback) {
      if(!notifTrigger) {
        return callback({error: "Trigger for dailyOneTimeReminder not found or is not active"}, null)
      }
      service.eventNotificationTriggerService.dailyOneTimeReminder(notifTrigger, callback)
    }
  ],
    function (err, events) {
      if (err) {
        utils.l.s("Error sending dailyOneTimeReminder notification::" + JSON.stringify(err) + "::" + JSON.stringify(events))
      } else {
        utils.l.i("job completed dailyOneTimeReminder successfully")
      }
    })
}

function eventUpcomingReminder() {
  utils.async.waterfall([
      function (callback) {
        models.notificationTrigger.getByQuery({
            type: 'schedule',
            triggerName: utils.constants.eventNotificationTrigger.launchUpComingReminders,
            isActive: true
          },
          utils.firstInArrayCallback(callback))
      },
      function(notifTrigger, callback) {
        if(!notifTrigger) {
          return callback({error: "Trigger for eventUpcomingReminder not found or is not active"}, null)
        }
        var stopTime = moment().add(8, 'minutes')
        var minsToSleep = 2

        service.eventNotificationTriggerService.launchUpComingReminders(notifTrigger)
        temporal.loop(minsToSleep * 60 * 1000, function() {
          service.eventNotificationTriggerService.launchUpComingReminders(notifTrigger)
          if(moment() > stopTime) {
            this.stop()
            return callback(null, null)
          }
        })
      }
    ],
    function (err, events) {
      if (err) {
        utils.l.s("Error sending eventUpcomingReminder notification::" + JSON.stringify(err) + "::" + JSON.stringify(events))
      } else {
        utils.l.i("eventUpcomingReminder was successful")
      }
    })
}

function helmetsFinder() {
  var fs = require("fs")
  console.log("\n *STARTING* \n")

  // Get content from file
  var contents = fs.readFileSync("/Users/abichsu/Desktop/Helmets/armor.json")
  // Define to JSON type
  var jsonContent = JSON.parse(contents)
  utils._.forEach(jsonContent.items, function(value, key) {
    if(value.subType == "Helmet") {
      request(value.icon, function (error, response, body) {

        if(response.statusCode == 200) {
          //console.log(value.icon.toString())
          fs.appendFile('/Users/abichsu/Desktop/Helmets/helmets.txt', "\"" + value.icon.toString() + "\"" + ",\n", function (err) {

          })
        }
      })
    }
  })
}

module.exports = {
  updatePassWord: updatePassWord,
  deleteOldFullEvents: deleteOldFullEvents,
  deleteOldStaleEvents: deleteOldStaleEvents,
  upcomingEventsReminder: upcomingEventsReminder,
  eventFullReminder: eventFullReminder,
  eventStartReminder: eventStartReminder,
  dailyOneTimeReminder: dailyOneTimeReminder,
  eventUpcomingReminder: eventUpcomingReminder,
  helmetsFinder: helmetsFinder,
  eventExpiry:eventExpiry,
  userTimeout:userTimeout,
  preUserTimeout:preUserTimeout
}