var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')
var eventNotificationTriggerService = require('./eventNotificationTriggerService')

function clearEventsForPlayer(user, launchStatus, consoleType, callback){

  utils.async.waterfall([
    function(callback){
      models.event.getByQuery(getEventsByPlayerQuery(user._id.toString(), consoleType, launchStatus), null, callback)
    },function(eventList, callback) {
      //mapSeries used to avoid the consurrency situation in the same session.
      utils.async.mapSeries(eventList, function(event, callback){
          handleLeaveEvent(user, {eId: event._id.toString()}, true, callback)
      },
      callback)
    }
  ], callback)
}


function createEvent(user, data, callback) {
  utils.async.waterfall(
    [
      function(callback) {
        models.event.createEvent(user, data, callback)
      },
      function(event, callback) {
        if(utils._.isInvalid(event)) {
          return callback(null, null)
        }
        if(event.players.length == 1) {
          models.notificationQueue.addToQueue(event._id, null, "newCreate")
          updateUserStats(user, "eventsCreated")
        } else {
          var notificationInformation = {
            userList: utils.convertMongooseArrayToPlainArray(utils.getNotificationPlayerListForEventExceptUser(user, event)),
            playerJoinedOrLeft: user.toObject()
          }
          models.notificationQueue.addToQueue(event._id, notificationInformation, "join")
          updateUserStats(user, "eventsJoined")
          updateUserStatsForFullEvent(event)
        }
        return callback(null, event)
      }
    ], callback)
}

function joinEvent(user, data, callback) {
  utils.async.waterfall(
    [
      function(callback) {
        models.event.joinEvent(user, data, callback)
      },
      function(event, callback) {
        if(utils._.isInvalid(event)) {
          return callback(null, null)
        }
        var notificationInformation = {
          userList: utils.convertMongooseArrayToPlainArray(utils.getNotificationPlayerListForEventExceptUser(user, event)),
          playerJoinedOrLeft: user.toObject()
        }
        models.notificationQueue.addToQueue(event._id, notificationInformation, "join")
        updateUserStats(user, "eventsJoined")
        updateUserStatsForFullEvent(event)
        return callback(null, event)
      }
    ], callback)
}

function leaveEvent(user, data, callback) {
  handleLeaveEvent(user, data, false, callback)
}

function handleLeaveEvent(user, data, userTimeout, callback) {
  utils.l.d('handleLeaveEvent::',data)
  var userObj = null
  utils.async.waterfall(
    [
      function(callback) {
        models.event.leaveEvent(user, data, callback)
      },
      function(event, callback) {
        models.user.getById(user._id.toString(), function(err, user) {

          if(utils._.isValidNonBlank(user)) {
            userObj = user
            if(!userTimeout && utils._.isValidNonBlank(event) && !event.deleted) {
              var playerLeft = [user]
              var notificationInformation = {
                userList: utils.convertMongooseArrayToPlainArray(playerLeft),
                playerJoinedOrLeft: user.toObject()
              }
              models.notificationQueue.addToQueue(event._id, notificationInformation, "leave")
              updateUserStats(user, "eventsLeft")
            }
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
            helpers.m.incrementEventsLeft(user._id.toString())
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
        utils.l.s("Error sending expireEvents notification::" + JSON.stringify(err))
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
      event.deleted=true
      if(notifTrigger.isActive && notifTrigger.notifications.length > 0)
        utils.async.map(notifTrigger.notifications,
          utils._.partial(eventNotificationTriggerService.createNotificationAndSend, event, null, null))
      helpers.firebase.createEventV2({_id : event._id, clanId : event.clanId}, null,true)
      return callback(null,event)
    }else return callback({error:"Error removing event.id"+event._id},null)
  })
}

function addComment(user, data, callback) {
  utils.async.waterfall([
    function(callback) {
      models.event.getById(data.eId, callback)
    },
    function(event, callback) {
      if(utils._.isInvalidOrBlank(event)) {
        utils.l.i("No such event found", event)
       return callback({error: "This event does has been deleted"}, null)
      }
      var comment = {
        user: user._id,
        text: data.text,
      }
      event.comments.push(comment)
      models.event.updateEvent(event, function(err, updatedEvent) {
        if(err) {
          utils.l.s("There was a problem in adding the comment to the database", err)
          return callback({error: "There was some problem in adding the comment"}, null)
        } else {
          return callback(null, updatedEvent)
        }
      })
    }
  ],
    function(err, event) {
      if(err) {
        return callback(err, null)
      } else {
        utils.l.d("comment was added successfully to event", data.text)
        utils.l.eventLog(event)
        var notificationInformation = {
          userList: utils.convertMongooseArrayToPlainArray(utils.getNotificationPlayerListForEventExceptUser(user, event)),
          comment: createCommentTextForPush(user, event, data.text)
        }
        models.notificationQueue.addToQueue(event._id, notificationInformation, "addComment")
        helpers.firebase.updateEventV2(event, user, true)
        return callback(null, event)
      }
    })
}

function reportComment(user, data, callback) {
  utils.async.waterfall([
    function(callback) {
      models.event.getById(data.eId, callback)
    },
    function(event, callback){
      if(utils._.isInvalidOrBlank(event)) {
        return callback({ error:"Event was not found" }, null)
      } else if(!utils.IsUserPartOfTheEvent(user, event)) {
        return callback({error: "You are not allowed to comment because you are not part of this event" }, null)
      } else {
        handleUserCommentReports(user, event, callback)
      }
    },
    function(event, callback) {
      var commentObj = utils._.find(event.comments, function(comment) {
        return comment._id.toString() == data.commentId.toString()
      })

      if(utils._.isInvalidOrBlank(commentObj)) {
        return callback({error: "Comment was not found"}, null)
      } else {
        commentObj.isReported = true
        models.event.updateEvent(event, function(err, updatedEvent) {
          if(err) {
            utils.l.s("There was a problem in reporting the comment to the database", err)
            return callback({error: "There was some problem in reporting the comment"}, null)
          } else {
            return callback(null, updatedEvent)
          }
        })
      }
    }
  ],
    function (err, event) {
      if(err) {
        return callback(err, null)
      } else {
        utils.l.d("comment was successfully reported", data.text)
        utils.l.eventLog(event)
        helpers.firebase.updateEventV2(event, user, true)
        return callback(null, event)
      }
    })
}

function handleUserCommentReports(user, event, callback) {
  utils.async.waterfall([
    function(callback) {
      var keys = [
        utils.constants.sysConfigKeys.commentsReportMaxValue,
        utils.constants.sysConfigKeys.commentsReportCoolingOffPeriod
      ]
      models.sysConfig.getSysConfigList(keys, callback)
    },
    function(commentsReportFrequency, callback) {
      if(utils._.isInvalidOrBlank(commentsReportFrequency)) {
        utils.l.d("report misuse values not found in the database")
        return callback({error: "There was a problem in reporting the comment"}, null)
      }

      var maxAllowedComments = utils._.find(commentsReportFrequency, function (value) {
        return value.key.toString() == utils.constants.sysConfigKeys.commentsReportMaxValue.toString()
      })

      if(user.commentsReported < parseInt(maxAllowedComments.value)) {
        user.commentsReported++
        user.lastCommentReportedTime = Date.now()
        user.hasReachedMaxReportedComments = false
      } else {
        var lastCommentReportedTime = utils.moment(user.lastCommentReportedTime).utc()
        var currentTIme = utils.moment().utc()
        var timeDiff = currentTIme.diff(lastCommentReportedTime, 'minutes')

        var coolingOffPeriod = utils._.find(commentsReportFrequency, function (value) {
          return value.key.toString() == utils.constants.sysConfigKeys.commentsReportCoolingOffPeriod.toString()
        })

        if(timeDiff > parseInt(coolingOffPeriod.value)) {
          user.commentsReported = 1
          user.lastCommentReportedTime = Date.now()
          user.hasReachedMaxReportedComments = false
        } else {
          user.commentsReported++
          user.lastCommentReportedTime = Date.now()
          user.hasReachedMaxReportedComments = true
        }
      }

      models.user.save(user, function(err, user) {
        if(err) {
          utils.l.d("There was a problem in saving the user", user)
          return callback({error: "There was a problem in reporting the comment"}, null)
        } else {
          utils.l.d("last reported comment was successfully updated on user")
          utils.l.userLog(user)
        }
        helpers.firebase.updateUser(user)
        return callback(null, event)
      })
    }
  ], callback)
}

function createCommentTextForPush(user, event, comment) {
  return utils.consoleByType(user, event.consoleType).consoleId + ": " + comment
}

function getEventsByPlayerQuery(playerId,consoleType,launchStatus){
  var query = {players: playerId}
  if(consoleType)
    query.consoleType = consoleType
  if(launchStatus)
    query.launchStatus = launchStatus
  return query
}

function updateUserStatsForFullEvent(event) {
  if(event.status.toString() == "full") {
    utils.async.mapSeries(event.players, function(player, callback) {
      models.user.getById(player._id.toString(), function (err, user) {
        updateUserStats(user, "eventsFull")
        helpers.m.incrementEventsFull(user)
        return callback(null, user)
      })
    },
    function (err, updatedUsers) {
      if(err) {
        utils.l.s("Error in updating user full event stats", err)
      } else {
        utils.l.d("Users were updated successfully", updatedUsers)
        utils.l.userLog(updatedUsers)
      }
    })
  }
}

function updateUserStats(user, eventAction) {
  user.stats[eventAction] = ++user.stats[eventAction]
  models.user.save(user, function (err, updatedUser) {
    if(err) {
      utils.l.s("Error in updating user stats", err)
    } else {
      utils.l.d("User was updated successfully")
      utils.l.userLog(updatedUser)
    }
  })
}

module.exports = {
  createEvent: createEvent,
  joinEvent: joinEvent,
  leaveEvent: leaveEvent,
  clearEventsForPlayer: clearEventsForPlayer,
  listEventCountByGroups: listEventCountByGroups,
  expireEvents: expireEvents,
  addComment: addComment,
  reportComment: reportComment
}