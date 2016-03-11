var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var utils = require('../../../utils')
var models = require('../../../models')
var helpers = require('../../../helpers')

var eventAction = {
  leave: 'leave',
  join: 'join'
}

function create(req, res) {
	utils.l.i("Event create request: " + JSON.stringify(req.body))
	createEvent(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function join(req, res) {
	utils.l.i("Event join request: " + JSON.stringify(req.body))
	joinEvent(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function list(req, res) {
	utils.l.i("Event list request")
	listEvents(function(err, events) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, events)
		}
	})
}

function leave(req, res) {
	utils.l.i("Event leave request: " + JSON.stringify(req.body))

	leaveEvent(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			// Adding event id in delete request since it helps the client identify which event was deleted
			if(utils._.isInvalidOrBlank(event)) {
				event =  {
					_id : req.body.eId
				}
			}
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function listEvents(callback) {
	models.event.listEvents(callback)
}

function createEvent(data, callback) {
	utils.async.waterfall(
		[
			function(callback) {
				models.event.createEvent(data, callback)
			},
			function(event, callback) {
        if(utils._.isInvalid(event)) {
          return callback(null, null)
        }
        sendPushNotificationForJoin(event)
				callback(null, event)
			}
		], callback)
}

function joinEvent(data, callback) {
	utils.async.waterfall(
		[
			function(callback) {
				models.event.joinEvent(data, callback)
			},
			function(event, callback) {
        if(utils._.isInvalid(event)) {
          return callback(null, null)
        }
        sendPushNotificationForJoin(event)
				callback(null, event)
			}
		], callback)
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
            sendPushNotificationForLeave(event, user)
          }
          callback(null, event)
        })
			}
		], callback)
}

function sendPushNotificationForLeave(event, user) {
  sendPushNotification(event, eventAction.leave, user)
}

function sendPushNotificationForJoin(event) {
  sendPushNotification(event, eventAction.join)
}

function sendPushNotification(event, eventType, user) {
	if(utils._.isValidNonBlank(event.creator)) {
		sendPushNotificationToCreator(event, eventType, user)
	}
	if(event.players.length == event.minPlayers && eventType == eventAction.join) {
		sendPushNotificationForMinimumPlayers(event)
	}
}

function sendPushNotificationToCreator(event, eventType, user) {
	models.installation.getInstallationByUser(event.creator, function(err, installation) {
		if(err) return
		if((eventType == eventAction.join && event.players.length > 1) || (eventType == eventAction.leave) ) {
      var message = getJoinMessage(event.eType, utils._.isValidNonBlank(user) ? user : event.players[event.players.length - 1], eventType)
			helpers.pushNotification.sendSinglePushNotification(event, message, installation)
		}
	})
}

function sendPushNotificationForMinimumPlayers(event) {
	utils.async.map(event.players, models.installation.getInstallationByUser, function(err, installations) {
			helpers.pushNotification.sendMultiplePushNotifications(installations, event, getMinPlayersJoinedMessage(event))
	})
}

function getMinPlayersJoinedMessage(event) {
	var playernames = (utils._.compact(utils._.map(event.players, function(player) {
		return player.userName
	}))).join(", ")
	var eventName = getEventName(event.eType)
	return utils.config.minPlayersJoinedMessage.replace(utils.config.join_username_placeHolder, playernames).replace(utils.config.join_eventname_placeHolder, eventName)
}

function getJoinMessage(activity, addedPlayer, eventType) {
  if(utils._.isInvalid(activity) || utils._.isInvalid(addedPlayer)) {
    return ""
  }
  var eventName = getEventName(activity)
	if(eventType == eventAction.join) {
		return utils.config.joinPushMessage.replace(utils.config.join_username_placeHolder, addedPlayer.userName).replace(utils.config.join_eventname_placeHolder, eventName)
	}else if(eventType == eventAction.leave){
		return utils.config.leavePushMessage.replace(utils.config.join_username_placeHolder, addedPlayer.userName).replace(utils.config.join_eventname_placeHolder, eventName)
	}
}

function getEventName(activity) {
  return  (utils._.compact([activity.aSubType, activity.aDifficulty, activity.aCheckpoint])).join(":")
}

routeUtils.rPost(router, '/create', 'create', create)
routeUtils.rPost(router, '/join', 'join', join)
routeUtils.rGet(router, '/list', 'list', list)
routeUtils.rPost(router, '/leave', 'leave', leave)
module.exports = router