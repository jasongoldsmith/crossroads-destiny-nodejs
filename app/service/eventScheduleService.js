var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')
var schedule = require('node-schedule');
var eventNotificationTriggerService = require('./eventNotificationTriggerService')
var scheduleHandles = []

function scheduleNotifications(){
  utils.l.d("scheduleNotifications::start")
  utils.async.waterfall([
      function (callback) {
        models.notificationTrigger.getByQuery({isActive:true, type:'schedule'}, callback)
      },
      function (notifTriggerList, callback) {
        utils.l.d("scheduleNotifications::notifTriggerList::"+notifTriggerList)
        var totalTriggersToLaunch = notifTriggerList?notifTriggerList.length:0
        if(totalTriggersToLaunch>0){
          utils.async.map(notifTriggerList, function(notifTrigger) {
            handleSchedule(notifTrigger,callback)
          },function(err,notifScheduled){
            if(scheduleHandles.length >0) callback(null,{totalTriggersToLaunch:totalTriggersToLaunch,notifScheduled:scheduleHandles.length })
            else callback({errorMessage:"Unable to schedule any of the schedules",error:err},null)
          })
        }else callback(null,{totalTriggersToLaunch:totalTriggersToLaunch,notifScheduled:0})
      }
    ],
    function (err, notifTriggerUpdate) {
      utils.l.d("scheduleNotifications::end")
      if (err) {
        utils.l.s("Error launching Notification Schedules::"+err+"::"+JSON.stringify(notifTriggerUpdate))
      } else {
        utils.l.i("Notification Schedules launched successfully::"+JSON.stringify(scheduleHandles.length))
      }
    }
  )
}

function handleSchedule(notifTrigger,callback){
/*
  var jobToRun = eventNotificationService.handleNotificationTrigger(notifTrigger.triggerName,null)
  scheduleHandles.push(schedule.scheduleJob(notifTrigger.schedule, jobToRun));
*/
  var scheduleJob = eventNotificationTriggerService.handleNotificationTrigger(notifTrigger,null)
  utils.l.d("schedule the job "+notifTrigger.triggerName+"::scheduleJob->handle()="+scheduleJob.name)
  scheduleHandles.push(scheduleJob);

  return callback(null, scheduleHandles.length)
}

/*
function launchEvents() {
  utils.l.i("Starting the job to launch events::"+utils.moment().utc().format())
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
            launchEvent(event, callback)
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

function launchEvent(event, callback){
  utils.async.waterfall([
    function (callback) {
      utils.l.d("launchEvent:: " + event.eventType+",launchDate:"+event.launchDate)
      models.event.launchEvent(event, callback)
    },function(updatedEvent,callback){
      if(updatedEvent){
        utils.l.d("About to send push notification: " + updatedEvent.eventType+",launchDate:"+updatedEvent.launchDate+",launchStatus:"+updatedEvent.launchStatus)
        helpers.pushNotification.sendPushNotificationForScheduler(event)
        return callback(null,1)
      }else {
        return callback(null,0)
      }
    }],callback)
}


module.exports={
  launchEvents:launchEvents
}*/

module.exports = {
  scheduleNotifications: scheduleNotifications
}