var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var utils = require('../../../utils')
var models = require('../../../models')
var helpers = require('../../../helpers')

function create(req, res) {
	utils.l.d("Event create request: " + JSON.stringify(req.body))
	createEvent(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			helpers.m.trackEvent(event)
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
			var player = utils._.find(event.players, function(player) {
				return player._id == req.body.player
			})
			helpers.m.incrementEventsJoined(player)
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function list(req, res) {
	utils.l.d("Event list request")
	listEvents(req.user, function(err, events) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, events)
		}
	})
}

function listAll(req, res) {
	utils.l.d("Event listAll request")
	listEvents(null, function(err, events) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, events)
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
  helpers.pushNotification.sendPushNotification(event, utils.constants.eventAction.leave, user)
}

function sendPushNotificationForJoin(event) {
  helpers.pushNotification.sendPushNotification(event, utils.constants.eventAction.join)
}

routeUtils.rPost(router, '/create', 'create', create)
routeUtils.rPost(router, '/join', 'join', join)
routeUtils.rGet(router, '/list', 'list', list)
routeUtils.rGet(router, '/listAll', 'listAll', listAll)
routeUtils.rPost(router, '/leave', 'leave', leave)
module.exports = router