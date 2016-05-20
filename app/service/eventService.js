var utils = require('../utils')
var models = require('../models')

function clearEventsForPlayer(playerId,callback){
  utils.async.waterfall([
    function(callback){
      models.event.listEventsByUser(playerId,callback)
    },function(eventList,callback){
      utils.async.map(eventList,function(event,callback){
        leaveEvent({eId: event._id,player: playerId},callback)
      },
      callback)
    }
  ],callback)

}

function leaveEvent(data, callback) {
  utils.async.waterfall(
    [
      function(callback) {
        models.event.leaveEvent(data, callback)
      },
      function(event, callback) {
        models.user.getById(data.player, function(err, user) {
          if(utils._.isValidNonBlank(user) && utils._.isValidNonBlank(event)) {
            service.eventBasedPushNotificationService.sendPushNotificationForLeave(event, user)
          }
          callback(null, event)
        })
      }
    ], callback)
}

module.exports = {
  leaveEvent:leaveEvent,
  clearEventsForPlayer:clearEventsForPlayer
}