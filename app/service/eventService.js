var utils = require('../utils')
var models = require('../models')
var eventPushService = require('./eventBasedPushNotificationService')

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
            eventPushService.sendPushNotificationForLeave(event, user)
          }
          callback(null, event)
        })
      }
    ], callback)
}

function listEventCountByGroups(groupIds, callback){
  models.event.listEventCount("clanId",{clanId:{$in:groupIds}},callback)
}

module.exports = {
  leaveEvent:leaveEvent,
  clearEventsForPlayer:clearEventsForPlayer,
  listEventCountByGroups: listEventCountByGroups
}