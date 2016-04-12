var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')

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
        helpers.pushNotification.sendPushNotificationForScheduler(updatedEvent)
        return callback(null,1)
      }else {
        return callback(null,0)
      }
    }],callback)
}

module.exports={
  launchEvents:launchEvents
}