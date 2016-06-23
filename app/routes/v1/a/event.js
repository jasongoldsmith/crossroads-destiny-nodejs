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
	listEvents(req.user, req.param('consoleType'), function(err, events) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err, {utm_dnt:"list"})
		} else {
			routeUtils.handleAPISuccess(req, res, events, {utm_dnt:"list"})
		}
	})
}

function listAll(req, res) {
	utils.l.d("Event listAll request")
	models.event.getByQuery({}, null, function(err, events) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err, {utm_dnt:"listAll"})
		} else {
			routeUtils.handleAPISuccess(req, res, events, {utm_dnt:"listAll"})
		}
	})
}

function listById(req, res) {
	utils.l.d("Get event by id request" + JSON.stringify(req.body))
	listEventById(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err, {utm_dnt:"listById"})
		} else {
			if(!event){
				err = { error: "Sorry, looks like that event is no longer available."}
				routeUtils.handleAPIError(req, res, err, err, {utm_dnt:"listById"})
			}else routeUtils.handleAPISuccess(req, res, event, {utm_dnt:"listById"})
		}
	})
}

function leave(req, res) {
	utils.l.d("Event leave request: " + JSON.stringify(req.body))

	service.eventService.leaveEvent(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			//Send just event id if the event is deleted for backward compatibility
			event  = utils._.isValidNonBlank(event) && event.deleted ? {_id : req.body.eId}:event
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

function listEvents(user, consoleType, callback) {
	if(utils._.isInvalidOrBlank(consoleType)) {
		consoleType = user.consoles[0].consoleType
	}
	models.event.getByQuery({clanId: user.clanId, consoleType: consoleType}, null, callback)
}

function listEventById(data, callback) {
	models.event.getById(data.id, callback)
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
				service.eventBasedPushNotificationService.sendPushNotificationForJoin(event)
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
				service.eventBasedPushNotificationService.sendPushNotificationForJoin(event)
				callback(null, event)
			}
		], callback)
}



function deleteEvent(data, callback) {
	models.event.deleteEvent(data, callback)
}

function clearEventsForPlayer(req,res){
	service.eventService.clearEventsForPlayer(req.body.playerId, function(err, events) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, events)
		}
	})
}

routeUtils.rPost(router, '/create', 'create', create)
routeUtils.rPost(router, '/join', 'join', join)
routeUtils.rGet(router, '/list', 'list', list, {utm_dnt:"androidAppVersion"})
routeUtils.rGet(router, '/listAll', 'listAll', listAll, {utm_dnt:"androidAppVersion"})
routeUtils.rPost(router, '/listById', 'listById', listById)
routeUtils.rPost(router, '/leave', 'leave', leave)
routeUtils.rPost(router, '/delete', 'remove', remove)
routeUtils.rPost(router, '/clear', 'clearEventsForPlayer', clearEventsForPlayer)
module.exports = router