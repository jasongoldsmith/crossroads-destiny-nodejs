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
}

function createNotificationAndSend(event,notification){
  utils.l.d("createNotificationAndSend::event="+event+"\nnotification::"+JSON.stringify(notification))
  notificationService.getNotificationDetails(event, notification, null, function(err,notificationResponse){
    helpers.pushNotification.sendMultiplePushNotificationsForUsers(notificationResponse,event)
  })
}

module.exports ={
  handleNotificationTrigger:handleNotificationTrigger,
  handleUpcomingEvents: handleUpcomingEvents,
  launchEventStart:launchEventStart
}