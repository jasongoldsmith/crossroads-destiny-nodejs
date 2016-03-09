var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var utils = require('../../../utils')
var models = require('../../../models')
var helpers = require('../../../helpers');

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
				models.event.createEvent(data, callback);
			},
			function(event, callback) {
        sendPushNotificationForJoin(event);
				callback(null, event);
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
        sendPushNotificationForJoin(event);
				callback(null, event);
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
          sendPushNotificationForLeave(event, user);
          callback(null, event);
        })
			}
		], callback)
}

function sendPushNotificationForLeave(event, user) {
  sendPushNotificationToCreatorForLeave(event, user);
}

function sendPushNotificationToCreatorForLeave(event, user) {
  models.installation.getInstallationByUser(event.creator, function(err, installation) {
    if(err) return;
    helpers.pushNotification.sendSinglePushNotification(event, getJoinMessage(event.eType, user, "leave"), installation)
  })
}


function sendPushNotificationForJoin(event) {
  sendPushNotificationToCreatorForJoin(event);
	if(event.players.length == event.minPlayers) {
		sendPushNotificationForMinimumPlayers(event);
	}
}

function sendPushNotificationToCreatorForJoin(event) {
	models.installation.getInstallationByUser(event.creator, function(err, installation) {
		if(err) return;
		if(event.players.length > 1 ) {
			helpers.pushNotification.sendSinglePushNotification(event, getJoinMessage(event.eType, event.players[event.players.length - 1], "join"), installation)
		}
	})
}

function sendPushNotificationForMinimumPlayers(event) {
	utils.async.map(event.players, models.installation.getInstallationByUser, function(err, installations) {
			helpers.pushNotification.sendMultiplePushNotifications(installations, event, getMinPlayersJoinedMessage(event));
	})
}

function getMinPlayersJoinedMessage(event) {
	var playernames = (utils._.compact(utils._.map(event.players, function(player) {
		return player.userName;
	}))).join(", ");
	var eventName = getEventName(event.eType);
	return utils.config.minPlayersJoinedMessage.replace(utils.config.join_username_placeHolder, playernames).replace(utils.config.join_eventname_placeHolder, eventName);;
}

function getJoinMessage(activity, addedPlayer, eventType) {
  var eventName = getEventName(activity);
	if(eventType == "join") {
		return utils.config.joinPushMessage.replace(utils.config.join_username_placeHolder, addedPlayer.userName).replace(utils.config.join_eventname_placeHolder, eventName);
	}else {
		return utils.config.leavePushMessage.replace(utils.config.join_username_placeHolder, addedPlayer.userName).replace(utils.config.join_eventname_placeHolder, eventName);
	}
}

function getEventName(activity) {
  return  (utils._.compact([activity.aSubType, activity.aDifficulty, activity.aCheckpoint])).join(":");
}


routeUtils.rPost(router, '/create', 'create', create)
routeUtils.rPost(router, '/join', 'join', join)
routeUtils.rGet(router, '/list', 'list', list)
routeUtils.rPost(router, '/leave', 'leave', leave)
module.exports = router