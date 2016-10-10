var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var utils = require('../../../utils')
var models = require('../../../models')
var helpers = require('../../../helpers')
var service = require('../../../service')

function create(req, res) {
	utils.l.i("Event create request: " + JSON.stringify(req.body))
	service.eventService.createEvent(req.user, req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			helpers.m.trackEvent(event)
			if(event.players.length == 1) {
				helpers.firebase.createEvent(event, req.user)
				helpers.m.incrementEventsCreated(req.user)
			} else {
				helpers.firebase.updateEvent(event, req.user)
				helpers.m.incrementEventsJoined(req.user)
			}
			routeUtils.handleAPISuccess(req, res, event,{eventId:event._id})
		}
	})
}

function join(req, res) {
	utils.l.d("Event join request: " + JSON.stringify(req.body))
	service.eventService.joinEvent(req.user, req.body, function(err, event) {
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
			routeUtils.handleAPISuccess(req, res, event,{eventId:event._id})
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
				routeUtils.handleAPIError(req, res, err, err)
			}else {
				service.eventService.publishFullEventListing(event,req)
				routeUtils.handleAPISuccess(req, res, event, {eventId: event._id})
			}
		}
	})
}

function leave(req, res) {
	utils.l.d("Event leave request: " + JSON.stringify(req.body))

	service.eventService.leaveEvent(req.user, req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			//Send just event id if the event is deleted for backward compatibility
			event  = utils._.isValidNonBlank(event) && event.deleted ? {_id : req.body.eId}:event
			routeUtils.handleAPISuccess(req, res, event,{eventId:event._id})
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
		consoleType = utils.primaryConsole(user).consoleType
	}
	models.event.getByQuery({clanId: user.clanId, consoleType: consoleType,
		$or: [
			{status: {$ne: "full"}},
			{players: user._id}
		]
	}, null, function(err, eventList) {
		if(err) {
			utils.l.s("There was an error in listEvent", err)
			return callback({error: "Something went wrong. Please try again in a few minutes"}, null)
		} else {
			return callback(null, eventList)
		}
	})
}

function listEventById(data, callback) {
	utils.async.waterfall([
		function(callback) {
			var defaultUserActiveTimeOutInMins = 10
			models.sysConfig.getSysConfig(utils.constants.sysConfigKeys.userActiveTimeOutInMins, function (err, userActiveTimeOutInMins) {
				if(err || !userActiveTimeOutInMins) {
					utils.l.s("There was a problem in getting userActiveTimeInMins from sysconfig table", err)
					return callback(null, defaultUserActiveTimeOutInMins)
				} else {
					return callback(null, userActiveTimeOutInMins.value)
				}
			})
		},
		function(userActiveTimeOutInMins, callback) {
			models.event.getById(data.id, function (err, event) {
				if(err) {
					utils.l.s("There was an error in listEventById", err)
					return callback({error: "Something went wrong. Please try again."}, null)
				} else {
					// We need to convert a mongo object to a plain object to add new fields (isActive)
					var eventObj = event.toObject()

					// We need to only add new fields and decide the creator for "full" events
					if(eventObj.status == "full") {
						var activeCutOffTime = utils.moment().subtract(userActiveTimeOutInMins, 'minutes')

						// Decide isActive for creator
						if(eventObj.creator.lastActiveTime < activeCutOffTime) {
							eventObj.creator.isActive = false
						} else {
							eventObj.creator.isActive = true
						}

						/*
						 * Decide isActive for event players
						 * We need a inactive player count to know if all players are inactive
						 */
						var areAllInactive = false
						var inactivePlayersCount = 0
						utils._.forEach(eventObj.players, function(player) {
							if(player.lastActiveTime < activeCutOffTime) {
								player.isActive = false
								inactivePlayersCount++
							} else {
								player.isActive = true
							}
						})

						if(inactivePlayersCount == eventObj.players.length) {
							areAllInactive = true
						}

						/*
						 * Remove creator from the list if it's active or if everyone is inactive
						 * We don't want to sort the creator in that case
						 */
						var creator = null
						if(eventObj.creator.isActive || areAllInactive) {
							creator = utils._.remove(eventObj.players, function(player) {
								if (player._id.toString() == eventObj.creator._id.toString()) {
									utils.l.d("player found")
									return player
								}
							})
						}

						eventObj.players = utils._.orderBy(eventObj.players, ['lastActiveTime'], ['desc'])

						// If creator is not null add it back to the list else we have a new creator
						if(creator) {
							eventObj.players.unshift(creator[0])
						} else {
							eventObj.creator = eventObj.players[0]
							event.creator = eventObj.players[0]
							event.players = eventObj.players
							models.event.update(event, function(err, updatedEvent) {
								if(err) {
									utils.l.s("There was an error in updating the event", err)
								} else {
									utils.l.eventLog("Event was updated successfully", updatedEvent)
								}
							})
						}
					}
					return callback(null, eventObj)
				}
			})
		}
	], callback)
}

function deleteEvent(data, callback) {
	models.event.deleteEvent(data, callback)
}

function clearEventsForPlayer(req, res) {
	service.eventService.clearEventsForPlayer(req.user, null, null, function(err, events) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, events)
		}
	})
}

function addComment(req, res) {
	utils.l.d("Add comment request: " + JSON.stringify(req.body))
	service.eventService.addComment(req.user, req.body, function (err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function reportComment(req, res) {
	utils.l.d("Report comment request: " + JSON.stringify(req.body))
	if(req.body.formDetails) {
		req.assert('formDetails.reportDetails', "Report details cannot be empty").notEmpty()
	}
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