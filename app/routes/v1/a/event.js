var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var utils = require('../../../utils')
var models = require('../../../models')
var helpers = require('../../../helpers')
var service = require('../../../service')

function create(req, res) {
	utils.l.i("Event create request: " + JSON.stringify(req.body))
	createEvent(req.user, req.body, function(err, event) {
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
	utils.l.i("Event join request: " + JSON.stringify(req.body))
	joinEvent(req.user, req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			// We do not want to track events if they are created by test users
			if (event.creator.clanId != "forcecatalyst") {
				var player = utils._.find(event.players, function(player) {
					return player._id.toString() == req.user._id.toString()
				})
				helpers.m.incrementEventsJoined(player)
			}
			helpers.firebase.updateEvent(event, req.user)
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function list(req, res) {
	utils.l.i("Event list request")
	listEvents(req.user, req.param('consoleType'), function(err, events) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err, {utm_dnt:"list"})
		} else {
			routeUtils.handleAPISuccess(req, res, events, {utm_dnt:"list"})
		}
	})
}

function listAll(req, res) {
	utils.l.i("Event listAll request")
	models.event.getByQuery({}, null, function(err, events) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err, {utm_dnt:"listAll"})
		} else {
			routeUtils.handleAPISuccess(req, res, events, {utm_dnt:"listAll"})
		}
	})
}

function listById(req, res) {
	utils.l.i("Get event by id request" + JSON.stringify(req.body))
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
	utils.l.i("Event leave request: " + JSON.stringify(req.body))

	service.eventService.leaveEvent(req.user, req.body, function(err, event) {
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
	utils.l.i("Event delete request")
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
		consoleType = utils.primaryConsole(user).consoleType
	}
	models.event.getByQuery({clanId: user.clanId, consoleType: consoleType}, null, callback)
}

function listEventById(data, callback) {
	models.event.getById(data.id, callback)
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
				service.eventBasedPushNotificationService.sendPushNotificationForJoin(event,
					utils.getNotificationPlayerListForEventExceptUser(user, event))
				service.eventBasedPushNotificationService.sendPushNotificationForNewCreate(event)
				callback(null, event)
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

				service.eventBasedPushNotificationService.sendPushNotificationForJoin(event,
					utils.getNotificationPlayerListForEventExceptUser(user, event))
				callback(null, event)
			}
		], callback)
}

function deleteEvent(data, callback) {
	models.event.deleteEvent(data, callback)
}

function clearEventsForPlayer(req, res) {
	service.eventService.clearEventsForPlayer(req.body.playerId, function(err, events) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, events)
		}
	})
}

function addComment(req, res) {
	service.eventService.addComment(req.user, req.body, function (err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function reportComment(req, res) {
	service.eventService.reportComment(req.user, req.body, function (err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

routeUtils.rPost(router, '/create', 'createEvent', create)
routeUtils.rPost(router, '/join', 'joinEvent', join)
routeUtils.rGet(router, '/list', 'listEvents', list, {utm_dnt:"androidAppVersion"})
routeUtils.rGet(router, '/listAll', 'listAllEvents', listAll, {utm_dnt:"androidAppVersion"})
routeUtils.rPost(router, '/listById', 'listEventById', listById)
routeUtils.rPost(router, '/leave', 'leaveEvent', leave)
routeUtils.rPost(router, '/delete', 'removeEvent', remove)
routeUtils.rPost(router, '/clear', 'clearEventsForPlayer', clearEventsForPlayer)
routeUtils.rPost(router, '/addComment', 'addEventComment', addComment)
routeUtils.rPost(router, '/reportComment', 'reportEventComment', reportComment)
module.exports = router