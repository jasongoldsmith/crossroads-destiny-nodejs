var utils = require('../utils')
var models = require('../models')
var schedule = require('node-schedule');
var notificationService = require('./eventNotificationService')
var helpers = require('../helpers')

function handleNotificationTrigger(notifTrigger, event){
  var scheduleTime = notifTrigger.schedule
  utils.l.d("handleNotificationTrigger::"+notifTrigger.triggerName+"@@@@"+utils.moment().utc().format())

  switch (notifTrigger.triggerName) {
    case utils.constants.eventNotificationTrigger.launchUpcomingEvents:
      utils.l.d("handleNotificationTrigger::launchUpcomingEvents::schedule::"+scheduleTime+"----"+utils.moment().utc().format())
      return schedule.scheduleJob(notifTrigger.triggerName,scheduleTime,handleUpcomingEvents.bind(null,notifTrigger))
      break;
    case utils.constants.eventNotificationTrigger.launchEventStart:
      utils.l.d("handleNotificationTrigger::launchEventStart::schedule::"+scheduleTime+"----"+utils.moment().utc().format())
      return schedule.scheduleJob(notifTrigger.triggerName,scheduleTime,launchEventStart.bind(null,notifTrigger))
      break;
    case utils.constants.eventNotificationTrigger.eventStartreminder:
      utils.l.d("handleNotificationTrigger::eventStartreminder::schedule::"+scheduleTime+"----"+utils.moment().utc().format())
      return schedule.scheduleJob(notifTrigger.triggerName,scheduleTime,eventStartreminder.bind(null,notifTrigger))
      break;
    case utils.constants.eventNotificationTrigger.dailyOneTimeReimnder:
      utils.l.d("handleNotificationTrigger::dailyOneTimeReimnder::schedule::"+scheduleTime+"----"+utils.moment().utc().format())
      return schedule.scheduleJob(notifTrigger.triggerName,scheduleTime,dailyOneTimeReimnder.bind(null,notifTrigger))
      break;
    case utils.constants.eventNotificationTrigger.launchUpComingReminders:
      utils.l.d("handleNotificationTrigger::launchUpComingReminders::schedule::"+scheduleTime+"----"+utils.moment().utc().format())
      return schedule.scheduleJob(notifTrigger.triggerName,scheduleTime,launchUpComingReminders.bind(null,notifTrigger))
      break
    default:
      break;
  }
}

function handleUpcomingEvents(notifTrigger) {
  utils.l.i("Starting the job to launch events::scheduled::"+notifTrigger.schedule+"::"+utils.moment().utc().format())
  utils.async.waterfall([
      function (callback) {
        var date = utils.moment().utc().add(utils.config.triggerIntervalMinutes,"minutes")
        models.event.getByQuery({ "launchStatus":utils.constants.eventLaunchStatusList.upcoming, launchDate:{ $lte: date }}, null, callback)
      },
      function (events, callback) {
        var eventsLaunched = 0;
        var totalEventsToLaunch = events?events.length:0
        var lastError = null
        if(totalEventsToLaunch>0){
          utils.async.map(events, function(event) {
            launchUpcomingEvent(event, notifTrigger, callback)
          },function(err,eventUpdatedStatus){
            var sum = 0
            eventsLaunched = utils._.sum(eventUpdatedStatus)

            if(eventsLaunched >0) callback(null,{totalEventsToLaunch:totalEventsToLaunch,eventsLaunched:eventsLaunched})
            else callback({errorMessage:"Unable to launch any of the events",error:lastError},null)
          })
        }else callback(null,{totalEventsToLaunch:totalEventsToLaunch,eventsLaunched:0})
      }
    ],
    function (err, eventsLaunchUpdate) {
      if (err) {
        utils.l.s("Error launching events::"+err+"::"+JSON.stringify(eventsLaunchUpdate))
      } else {
        utils.l.i("Events launched successfully::"+JSON.stringify(eventsLaunchUpdate))
      }
      utils.l.i("Completed the job to launch events::"+utils.moment().utc().format())
    }
  )
}

function launchUpcomingEvent(event, notifTrigger, callback){
  utils.async.waterfall([
    function (callback) {
      utils.l.d("launchEvent:: " + event.eventType+",launchDate:"+event.launchDate)
      models.event.launchEvent(event, callback)
      //TODO: Make a firebase API to notify
    },function(updatedEvent,callback){
      // for each notification in the list return notification object with formatter message, recepients
      // Return notificationResp - array of notification{name:"",recepients:[{}],message:"")}
      if(notifTrigger.isActive && notifTrigger.notifications.length > 0){
        //Send NoSignupNotification only if there are no players signedup. i.e Only player in event is creator
        if(event.players.length > 1) utils._.remove(notifTrigger.notifications, {name: 'NoSignupNotification'})
        else utils._.remove(notifTrigger.notifications, {name: 'EventNotFullNotification'})

        utils.async.map(notifTrigger.notifications,utils._.partial(createNotificationAndSend,event))
      }else callback(null,null)
    }],callback)
}

function launchEventStart(notifTrigger){
  utils.l.d("Starting trigger launchEventStart::scheduled::"+notifTrigger.schedule+"::"+utils.moment().utc().format())
  utils.async.waterfall([
      function (callback) {
        var date = utils.moment().utc()
        models.event.getByQuery({"launchStatus":utils.constants.eventLaunchStatusList.now, launchDate:{$lte:date}, status:"full", notifStatus:{$nin:["launchEventStart"]}}, null, callback)
      },
      function (events, callback) {
        var totalEventsToLaunch = events?events.length:0
        if(totalEventsToLaunch>0){
          utils.async.map(events, function(event) {
            if(notifTrigger.isActive && notifTrigger.notifications.length > 0){
              utils.async.map(notifTrigger.notifications,utils._.partial(createNotificationAndSend,event))
              event.notifStatus.push("launchEventStart")
              models.event.update(event,callback)
            }else callback(null,null)
          },function(err,updatedEvents){
            callback(err,updatedEvents)
          })
        }else callback(null,null)
      }
    ],
    function (err, updatedEvents) {
      if (err) {
        utils.l.s("Error sending events start notification::"+err+"::"+JSON.stringify(updatedEvents))
      }
      utils.l.i("Completed trigger launchEventStart::scheduled::"+notifTrigger.schedule+"::"+utils.moment().utc().format())
    }
  )
}

function eventStartreminder(notifTrigger){
  utils.l.d("Starting trigger eventStartreminder::scheduled::"+notifTrigger.schedule+"::"+utils.moment().utc().format())
  utils.async.waterfall([
      function (callback) {
        var date = utils.moment().utc().add(utils.config.triggerReminderInterval,"minutes")
        models.event.getByQuery({"launchStatus":utils.constants.eventLaunchStatusList.upcoming, launchDate:{$lte:date},notifStatus:{$nin:["eventStartreminder"]}}, null, callback)
      },
      function (events, callback) {
        var totalEventsToLaunch = events?events.length:0
        if(totalEventsToLaunch>0){
          utils.async.map(events, function(event) {
            if(notifTrigger.isActive && notifTrigger.notifications.length > 0){
              utils.async.map(notifTrigger.notifications,utils._.partial(createNotificationAndSend,event))
              event.notifStatus.push("eventStartreminder")
              models.event.update(event,callback)
            }else callback(null,null)
          },function(err,updatedEvents){
            callback(err,updatedEvents)
          })
        }else callback(null,null)
      }
    ],
    function (err, updatedEvents) {
      if (err) {
        utils.l.s("Error sending eventStartreminder notification::"+err+"::"+JSON.stringify(updatedEvents))
      }
      utils.l.i("Completed trigger eventStartreminder::scheduled::"+notifTrigger.schedule+"::"+utils.moment().utc().format())
    }
  )
}

function dailyOneTimeReimnder(notifTrigger){
  utils.l.d("Starting trigger dailyOneTimeReimnder::scheduled::"+notifTrigger.schedule+"::"+utils.moment().utc().format())
  utils.async.waterfall([
      function (callback) {
        models.event.getByQuery({"launchStatus":utils.constants.eventLaunchStatusList.upcoming,status:{$ne:"full"}}, null, callback)
      },
      function (events, callback) {
        var totalEventsToLaunch = events?events.length:0
        if(totalEventsToLaunch>0){
          if(notifTrigger.isActive && notifTrigger.notifications.length > 0){
            var eventsByClan = utils._.countBy(events,'creator.clanId')
            for (var clanId in eventsByClan) {
              if(eventsByClan[clanId] > 0)
                utils.async.map(notifTrigger.notifications, utils._.partial(createAggregateNotificationAndSend, clanId, eventsByClan[clanId]))
            }
          }
        }
        callback(null,null)
      }
    ],
    function (err, updatedEvents) {
      if (err) {
        utils.l.s("Error sending dailyOneTimeReimnder notification::"+err+"::"+JSON.stringify(updatedEvents))
      }
      utils.l.i("Completed trigger dailyOneTimeReimnder::scheduled::"+notifTrigger.schedule+"::"+utils.moment().utc().format())
    }
  )
}

function launchUpComingReminders(notifTrigger){
  utils.l.d("Starting trigger launchUpComingReminders::scheduled::"+notifTrigger.schedule+"::"+utils.moment().utc().format())
  utils.async.waterfall([
      function (callback) {
        var date = utils.moment().utc().add(utils.config.triggerUpcomingReminderInterval,"minutes")
        models.event.getByQuery({launchStatus:utils.constants.eventLaunchStatusList.now,launchDate:{$lte:date},notifStatus:{$nin:["RaidEventLf2mNotification","EventLf1mNotification"]}}, null, callback)
      },
      function (events, callback) {
        var totalEventsToLaunch = events?events.length:0
        if(totalEventsToLaunch>0){
          utils.async.map(events, function(event) {
            if(notifTrigger.isActive && notifTrigger.notifications.length > 0){
              var raidLf2mfNotif = utils._.find(notifTrigger.notifications,{"name":"RaidEventLf2mNotification"})
              var eventLf1mNotif = utils._.find(notifTrigger.notifications,{"name":"EventLf1mNotification"})
              if(event.eType.aType== "Raid" && ((event.maxPlayers - event.players.length) ==2) ){
                createNotificationAndSend(event,raidLf2mfNotif)
                event.notifStatus.push("RaidEventLf2mNotification")
              }

              if((event.maxPlayers - event.players.length) ==1 ){
                createNotificationAndSend(event,eventLf1mNotif)
                event.notifStatus.push("EventLf1mNotification")
              }
              models.event.update(event,callback)
            }else callback(null,null)
          },function(err,updatedEvents){
            callback(err,updatedEvents)
          })
        }else callback(null,null)
      }
    ],
    function (err, updatedEvents) {
      if (err) {
        utils.l.s("Error sending launchUpComingReminders notification::"+err+"::"+JSON.stringify(updatedEvents))
      }
      utils.l.i("Completed trigger launchUpComingReminders::scheduled::"+notifTrigger.schedule+"::"+utils.moment().utc().format())
    }
  )
}

function createNotificationAndSend(event,notification){
  utils.l.d("createNotificationAndSend::event="+event+"\nnotification::"+JSON.stringify(notification))
  notificationService.getNotificationDetails(event, notification, null, function(err,notificationResponse){
    if(err) util.l.s("createNotificationAndSend::Error while creating notificationResponse object"+err)
    helpers.pushNotification.sendMultiplePushNotificationsForUsers(notificationResponse,event)
  })
}

function createAggregateNotificationAndSend(clanId,eventCount, notification){
  utils.l.d("createAggregateNotificationAndSend::notification::"+JSON.stringify(notification))
  notificationService.getAggregateNotificationDetails(clanId,eventCount, notification, function(err,notificationResponse){
    helpers.pushNotification.sendMultiplePushNotificationsForUsers(notificationResponse,null)
  })
}

module.exports ={
  handleNotificationTrigger:handleNotificationTrigger,
  handleUpcomingEvents: handleUpcomingEvents,
  launchEventStart:launchEventStart
}