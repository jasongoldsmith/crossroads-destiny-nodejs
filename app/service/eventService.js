var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')
var eventPushService = require('./eventBasedPushNotificationService')
var eventNotificationTriggerService = require('./eventNotificationTriggerService')
function clearEventsForPlayer(playerId,launchStatus,callback){
  utils.async.waterfall([
    function(callback){
      models.event.listEventsByUser(playerId,launchStatus,callback)
    },function(eventList,callback){
      //mapSeries used to avoid the consurrency situation in the same session.
      utils.async.mapSeries(eventList,function(event,callback){
          handleLeaveEvent({eId: event._id,player: playerId},true,callback)
      },
      callback)
    }
  ],callback)

}

function leaveEvent(data, callback) {
  handleLeaveEvent(data,false,callback)
}

function handleLeaveEvent(data,userTimeout,callback) {
  utils.l.d('handleLeaveEvent::',data)
  var userObj = null
  utils.async.waterfall(
    [
      function(callback) {
        models.event.leaveEvent(data, callback)
      },
      function(event, callback) {
        models.user.getById(data.player, function(err, user) {

          if(utils._.isValidNonBlank(user)) {
            userObj = user
            if(!userTimeout && utils._.isValidNonBlank(event) && !event.deleted) eventPushService.sendPushNotificationForLeave(event, user)
          }
          callback(null, event)
        })
      },function(event,callback){
        // Adding event id in delete request since it helps the client identify which event was deleted
        utils.l.d('event.deleted'+event.deleted)
        if(utils._.isValidNonBlank(event) && event.deleted) {
          // When the event has been deleted we want to make all fields null in firebase
          helpers.firebase.createEventV2({_id : data.eId,clanId:event.clanId}, userObj,userTimeout)
        } else {
          // We do not want to track events if they are created by test users
          if (event.creator.clanId != "forcecatalyst") {
            helpers.m.incrementEventsLeft(data.player)
          }
          helpers.firebase.updateEventV2(event, userObj,userTimeout)
        }
        callback(null,event)
      }
    ], callback)
}

function listEventCountByGroups(groupIds, consoleType, callback){
  models.event.listEventCount("clanId",{clanId:{$in:groupIds},consoleType:consoleType},callback)
}

function expireEvents(notifTrigger,sysConfig){
  utils.l.d("Starting expireEvents")
  utils.async.waterfall([
      function (callback) {
        var eventExpiryInterval = sysConfig.value || utils.config.eventExpiryInterval
        utils.l.d('looking for events inactive for '+eventExpiryInterval+" mins")
        var date = utils.moment().utc().add(eventExpiryInterval, "minutes")
        var date1 = utils.moment().utc()
        models.event.getEventsByQuery({
            launchStatus: utils.constants.eventLaunchStatusList.now,
            updated: {$lte: date}
          },
          callback)
      },
      function(events, callback) {
        var totalEventsToExpire = events ? events.length: 0
        if(totalEventsToExpire > 0) {
          utils.async.map(events, function(event,asyncCallback) {
            archiveEvent(event,notifTrigger,asyncCallback)
          },function(err, updatedEvents) {
            return callback(err, updatedEvents)
          })
        }else {
          return callback(null, null)
        }
      }
    ],
    function (err, updatedEvents) {
      if (err) {
        utils.l.s("Error sending expireEvents notification::" + JSON.stringify(err) + "::" + JSON.stringify(updatedEvents))
      }
      utils.l.i("Completed trigger expireEvents::" +utils.moment().utc().format())
    }
  )
}

function archiveEvent(event,notifTrigger,callback){
  utils.async.waterfall([
    function(callback){
      models.archiveEvent.createArchiveEvent(event, function(err,data){})
      models.event.removeEvent(event,callback)
    }
  ],function(err,eventRemoveStatus){
    utils.l.d('eventRemoved',utils.l.eventLog(eventRemoveStatus))
    if(!err){
      if(notifTrigger.isActive && notifTrigger.notifications.length > 0)
        utils.async.map(notifTrigger.notifications, utils._.partial(eventNotificationTriggerService.createNotificationAndSend,event,null))
      //utils.l.d("event after remove::",event)
      helpers.firebase.createEventV2({_id : event._id, clanId : event.clanId}, null,true)
      return callback(null,event)
    }else return callback({error:"Error removing event.id"+event._id},null)
  })
}

module.exports = {
  leaveEvent:leaveEvent,
  clearEventsForPlayer:clearEventsForPlayer,
  listEventCountByGroups: listEventCountByGroups,
  expireEvents:expireEvents
}