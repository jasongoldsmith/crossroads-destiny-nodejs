var express = require('express')
var routeUtils = require('./app/routes/routeUtils')
var utils = require('./app/utils/index')
var models = require('./app/models/index')
var helpers = require('./app/helpers')
require('./app/startup/db')
var config = require("config")
var fs = require('fs')
var passwordHash = require('password-hash')
var moment = require('moment')
var service = require ('./app/service')

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

function dailyOneTimeReminder() {
  utils.async.waterfall([
    function (callback) {
      models.notificationTrigger.getByQuery({type:'schedule', triggerName:"dailyOneTimeReminder"},
        utils.firstInArrayCallback(callback))
    },
    function(notifTrigger, callback) {
      if(!notifTrigger) {
        return callback({error:"Trigger for dailyOneTimeReminder not found or is not active"}, null)
      }
      service.eventNotificationTriggerService.dailyOneTimeReminder(notifTrigger, callback)
    }
  ],
    function (err, events) {
      if (err) {
        utils.l.s("Error sending dailyOneTimeReminder notification::"+err+"::"+JSON.stringify(events))
      } else {
        utils.l.i("job completed dailyOneTimeReminder successfully")
      }
    })
}

module.exports = {
  updatePassWord: updatePassWord,
  deleteOldFullEvents: deleteOldFullEvents,
  deleteOldStaleEvents: deleteOldStaleEvents,
  dailyOneTimeReminder: dailyOneTimeReminder
}