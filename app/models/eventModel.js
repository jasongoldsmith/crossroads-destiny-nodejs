var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')
var moment = require('moment')

// Activity Schema
var eventSchema = require('./schema/eventSchema')
var userModel = require ('./userModel')
//mongoose.set('debug',true)

// Model initialization
var Event = mongoose.model('Event', eventSchema.schema)

function roundDateToNearestQuaterHour(dateString) {
	if(utils._.isInvalidOrBlank(dateString)) {
		dateString = new Date()
	}
	var coeff = 1000 * 60 * 15;
	var date = new Date(dateString)
	return new Date(Math.round(date.getTime() / coeff) * coeff)
}

function getByQuery(query, user, callback) {
	Event
		.find(query)
		.populate("eType")
		.populate("creator", "-passWord")
		.populate("players", "-passWord")
		.sort({launchDate:"ascending"})
		.exec(function (err, events) {
			if (user) {
				events = events.filter(function(event) {
					return event.creator.clanId == user.clanId
				})
			}
			callback(null, events)
		})
}

function getById(id, callback) {
	if (!id) return callback("Invalid id:" + id)
	getByQuery({'_id':id}, null, utils.firstInArrayCallback(callback))
}

function update(event, callback) {
	event.save(function (err, data) {
		if (err) {
			return callback(err, null)
		} else {
			Event.findOne({_id: data._id}, callback)
		}
	})
}

function checkIfPlayerAlreadyExists(event, data) {
	var playerAlreadyExists = utils._.some(event.players, function (player) {
		return player == data.toString()
	})

	return playerAlreadyExists
}

function handleNoEventFound(event, callback) {
	if (!event) {
		utils.l.d("no event found")
		return callback({ error: "Sorry, that event no longer exists. Please refresh." }, null)
	} else {
		return callback(null, event)
	}
}

function createEvent(data, callback) {
	var checkWithDate = data.launchDate
	if(data.launchDate) {
		data.launchDate = roundDateToNearestQuaterHour(data.launchDate)
		/*
		We need to macke the checkWithDate null if the launchDate is within 15 minutes
		because then the event is no longer considered upcoming
		 */
		var startDate = moment(data.launchDate)
		var endDate = moment(Date.now())
		var minutesDiff = Math.abs(endDate.diff(startDate, 'minutes'))
		if(minutesDiff < 15) {
			checkWithDate = null
		} else {
			data.launchStatus = utils.constants.eventLaunchStatusList.upcoming
		}
	}

	var eventObj = new Event(data)
	utils.async.waterfall([
		function(callback) {
			userModel.getById(data.creator, callback)
		},
		function (user, callback) {
			utils.l.d("Found user: " + JSON.stringify(user))
			if (utils._.isInvalidOrBlank(checkWithDate)) {
				getByQuery({ eType: data.eType, launchStatus: "now" }, user, utils.firstInArrayCallback(callback))
			} else {
				getByQuery({ eType: data.eType, launchDate: data.launchDate }, user, utils.firstInArrayCallback(callback))
			}
		},
		function (event, callback) {
			if (!event) {
				utils.l.d ("no event found, creating a new event")
				eventObj.save(callback)
			} else {
				var playerAlreadyExists = utils._.some(event.players, function (player) {
					return player._id.toString() == data.creator.toString()
				})

				if (playerAlreadyExists) {
					utils.l.d("player already exists, sending the event as it is")
					return callback(null, event)
				} else {
					if (event.status == "full") {
						utils.l.d("creating a new event")
						eventObj.save(callback)
					} else {
						utils.l.d("found an already existing event, adding the new player to the event")
						event.players.push(data.creator)
						update(event, callback)
					}
				}
			}
		}
	],
		function(err, event) {
			if (err) {
				return callback(err, null)
			} else {
				getById(event._id, callback)
			}
		}
	)
}

function joinEvent(data, callback) {
	utils.async.waterfall([
		function (callback) {
			Event.findOne({_id: data.eId}, callback)
		},
		function(event, callback) {
			handleNoEventFound(event, callback)
		},
		function(event, callback) {
			if (checkIfPlayerAlreadyExists(event, data.player)) {
				utils.l.d("player already exists, sending the event as it is")
				return callback(null, event)
			} else {
				if (event.status == "full") {
					return callback({ error: "Sorry, that event is full. Please refresh."}, null)
				} else {
					event.players.push(data.player)
					update(event, callback)
				}
			}
		}
	],
		function(err, event) {
			if (err) {
				return callback(err, null)
			} else {
				getById(event._id, callback)
			}
		}
	)
}

function leaveEvent(data, callback) {
	utils.async.waterfall([
		function(callback) {
			Event.findOne({_id: data.eId}, callback)
		},
		function(event, callback) {
			handleNoEventFound(event, callback)
		},
		function(event, callback) {
			if(!checkIfPlayerAlreadyExists(event, data.player)) {
				utils.l.d("player is not part of the event")
				return callback({ error: "Something went wrong! You are trying to leave an event that you are not attending." }, null)
			} else {
				return callback(null, event)
			}
		},
		function(event, callback) {
			if(event.players.length == 1) {
				utils.l.d("Just one player in the event; deleting the event")
				event.remove(callback)
			} else {
				var player = utils._.remove(event.players, function(player) {
					if (player.toString() == data.player.toString()) {
						utils.l.d("player found")
						return player
					}
				})
				utils.l.d("removing player")
				event.players.remove(player)

				if(event.creator == data.player) {
					utils.l.d("player is also the creator; changing the creator to the first user in the list")
					event.creator = event.players[0]
				}

				// Reseting the notification flags for reminders
				if(event.maxPlayers - event.players.length == 3) {
					event.notifStatus.remove("RaidEventLf2mNotification")
				} else if(event.maxPlayers - event.players.length == 2) {
					event.notifStatus.remove("EventLf1mNotification")
				} else if(event.maxPlayers - event.players.length == 1) {
					event.notifStatus.remove("launchEventStart")
				}

				update(event, callback)
			}
		}
	],
		function(err, event) {
			if (err) {
				return callback(err, null)
			} else {
				getById(event._id, callback)
			}
		}
	)
}

function deleteEvent(data, callback) {
	utils.async.waterfall([
		function(callback) {
			Event.findOne({_id: data.eId}, callback)
		},
		function(event, callback) {
			handleNoEventFound(event, callback)
		},
		function(event, callback) {
			utils.l.d("Deleting the event")
			event.remove(callback)
		}
	],
		function(err, event) {
			if (err) {
				return callback(err, null)
			} else {
				getById(event._id, callback)
			}
		}
	)
}

function listEvents(user, callback) {
	getByQuery({}, user, callback)
}

function launchEvent(event, callback){
	utils.l.d("Updating event launch status "+event.eType);
	utils.async.waterfall([
				function(callback) {
					getById(event._id, callback)
				},
				function (event, callback) {
					if(!event){
						return callback("Event does not exist. It is either full or an invalid event is being updated.",null)
					}
					utils.l.d("Found event: " + JSON.stringify(event))
					utils._.extend(event, {launchStatus:utils.constants.eventLaunchStatusList.now})
					update(event,callback)
				}
			],function(err, updatedEvent) {
				if (err) {
					return callback(err, null)
				} else {
					//return callback(null, updatedEvent) //
					getById(updatedEvent._id, callback)
				}
			}
	)
}

module.exports = {
	model: Event,
	createEvent: createEvent,
	joinEvent: joinEvent,
	listEvents: listEvents,
	leaveEvent: leaveEvent,
	deleteEvent: deleteEvent,
	getByQuery: getByQuery,
	getById: getById,
	launchEvent: launchEvent,
	update:update
}