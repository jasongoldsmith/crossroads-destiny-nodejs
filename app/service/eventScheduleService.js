var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')

function launchEvents() {
  utils.l.d("Starting the job to launch events::"+utils.moment().format())
  utils.async.waterfall([
      function (callback) {
        var date = utils.moment().add(-utils.config.triggerIntervalMinutes,"minutes")
        models.event.getByQuery({ "triggerStatus":"upcoming", launchDate:{ $ge: date }}, null, callback)
      },
      function (events, callback) {
        var eventsLaunched = 0;
        var totalEventsToLaunch = events.length
        var lastError = null
        if(totalEventsToLaunch>0){
          utils._.forEach(events, function(event) {
            launchEvent(event, function(err,updatedEvent){
              if(updatedEvent) eventsLaunched ++
              else lastError = err
            })
          })
          if(eventsLaunched >0) callback(null,{totalEventsToLaunch:totalEventsToLaunch,eventsLaunched:eventsLaunched})
          else callback({errorMessage:"Unable to launch any of the events",error:lastError},null)
        }else callback(null,{totalEventsToLaunch:totalEventsToLaunch,eventsLaunched:0})
      }
    ],
    function (err, eventsLaunchUpdate) {
      if (err) {
        utils.l.s("Error launching events::"+err+"::"+eventsLaunchUpdate)
      } else {
        utils.l.i("Events launched successfully::"+eventsLaunchUpdate)
      }
    })
}

function launchEvent(event, callback){
  utils.l.d("launchEvent:: " + event)
  models.event.launchEvent(event, callback)
  utils.l.d("About to send push notification: " + event)
  helpers.sendPushNotificationForScheduler(event)
}

module.exports={
  launchEvents:launchEvents
}