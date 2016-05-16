var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var utils = require('../../../utils')
var models = require('../../../models')
var helpers = require('../../../helpers')
var service = require('../../../service')

function create(req, res) {
	utils.l.d("Event create request: " + JSON.stringify(req.body))
	createEvent(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			// We do not want to track events if they are created by test users
			if (event.creator.clanId != "forcecatalyst") {
				helpers.m.trackEvent(event)
			}
			if(event.players.length == 1) {
				helpers.firebase.createEvent(event, req.user)
			} else {
				helpers.firebase.updateEvent(event, req.user)
			}
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function join(req, res) {
	utils.l.d("Event join request: " + JSON.stringify(req.body))
	joinEvent(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			// We do not want to track events if they are created by test users
			if (event.creator.clanId != "forcecatalyst") {
				var player = utils._.find(event.players, function(player) {
					return player._id == req.body.player
				})
				helpers.m.incrementEventsJoined(player)
			}
			helpers.firebase.updateEvent(event, req.user)
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function list(req, res) {
	utils.l.d("Event list request")
	listEvents(req.user, function(err, events) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err,{utm_dnt:"list"})
		} else {
			routeUtils.handleAPISuccess(req, res, events,{utm_dnt:"list"})
		}
	})
}

function listAll(req, res) {
	utils.l.d("Event listAll request")
	listEvents(null, function(err, events) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err,{utm_dnt:"listAll"})
		} else {
			routeUtils.handleAPISuccess(req, res, events,{utm_dnt:"listAll"})
		}
	})
}

function leave(req, res) {
	utils.l.d("Event leave request: " + JSON.stringify(req.body))

	leaveEvent(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			// Adding event id in delete request since it helps the client identify which event was deleted
			if(utils._.isInvalidOrBlank(event)) {
				event =  {
					_id : req.body.eId
				}
				// When the event has been deleted we want to make all fields null in firebase
				helpers.firebase.createEvent(event, req.user)
			} else {
				// We do not want to track events if they are created by test users
				if (event.creator.clanId != "forcecatalyst") {
					helpers.m.incrementEventsLeft(req.body.player)
				}
				helpers.firebase.updateEvent(event, req.user)
			}
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function remove(req, res) {
	utils.l.d("Event delete request")
	deleteEvent(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			// Adding event id in delete request since it helps the client identify which event was deleted
			if(utils._.isInvalidOrBlank(event)) {
				event= {
					_id: req.body.eId
				}
			}
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function listEvents(user, callback) {
	models.event.listEvents(user, callback)
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
				service.eventBasedPushNotificationService.sendPushNotificationForNewCreate(event)
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
				if(event.launchStatus == "now") {
					sendPushNotificationForJoin(event)
				}
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
          if(utils._.isValidNonBlank(user) && utils._.isValidNonBlank(event) && event.launchStatus == "now") {
            sendPushNotificationForLeave(event, user)
          }
          callback(null, event)
        })
			}
		], callback)
}

function deleteEvent(data, callback) {
	models.event.deleteEvent(data, callback)
}

function sendPushNotificationForLeave(event, user) {
  helpers.pushNotification.sendPushNotification(event, utils.constants.eventAction.leave, user)
}

function sendPushNotificationForJoin(event) {
  helpers.pushNotification.sendPushNotification(event, utils.constants.eventAction.join)
}

routeUtils.rPost(router, '/create', 'create', create)
routeUtils.rPost(router, '/join', 'join', join)
routeUtils.rGet(router, '/list', 'list', list,{utm_dnt:"androidAppVersion"})
routeUtils.rGet(router, '/listAll', 'listAll', listAll,{utm_dnt:"androidAppVersion"})
routeUtils.rPost(router, '/leave', 'leave', leave)
routeUtils.rPost(router, '/delete', 'remove', remove)
module.exports = router