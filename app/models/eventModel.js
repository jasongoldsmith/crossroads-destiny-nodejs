var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')
var lodash = require ('../utils/lodash')

// Activity Schema
var eventSchema = require('./schema/eventSchema')

// Model initialization
var Event = mongoose.model('Event', eventSchema.schema)

function setEventStatus(event) {
	var size=event.players.length
	if ( size==1 ) {
		event.status="new"
	} else if ( size<event.minPlayers ) {
		event.status="open"
	} else if ( size >= event.minPlayers && size < event.maxPlayers ) {
		event.status="can_join"
	} else {
		event.status="full"
	}
}

function update(event, callback) {
	event.save(function (err, data) {
		if (err) {
			return callback(err, null)
		} else {
			return callback(null, data)
		}
	})
}

function checkIfPlayerAlreadyExists(event, data) {
	var playerAlreadyExists = lodash.some(event.players, function (player) {
		return player.toString() === data.toString()
	})

	return playerAlreadyExists
}

function handleNoEventFound(event, callback) {
	if (!event) {
		utils.l.i("no event found")
		return callback({ error: "No event was found" }, null)
	} else {
		return callback(null, event)
	}
}

function handleEventFull(event, callback) {
	if (event.status == "full") {
		utils.l.i("event is full")
		return callback({ error: "Event is full"}, null)
	} else {
		return callback(null, event)
	}
}

function createEvent(data, callback) {
	var eventObj = new Event(data)
	utils.async.waterfall([
		function (callback) {
			Event.findOne({eType: data.eType}, callback)
		},
		function (event, callback){
			if (!event) {
				utils.l.i ("no event found, creating a new event")
				eventObj.save(callback)
			} else {
				if (checkIfPlayerAlreadyExists(event, data.creator)) {
					utils.l.i("player already exists")
					return callback({ error: "Player is already in the event" }, null)
				} else {
					handleEventFull(event, function (err, oldEvent) {
						if (err) {
							utils.l.i ("creating a new event")
							eventObj.save(callback)
						} else {
							utils.l.i("found an already existing event, adding the new player to the event")
							event.players.push(data.creator)
							setEventStatus(event)
							update(oldEvent, callback)
						}
					})
				}
			}
		}
	],
		function(err, event) {
			if (err) {
				return callback(err, null)
			} else {
				return callback(null, event)
			}
		}
	)
}

function joinEvent(data, callback) {
	utils.async.waterfall([
		function (callback) {
			Event.findOne({_id: data.eId}, callback)
		},
		function (event, callback) {
			handleNoEventFound(event, callback)
		},
		function (event, callback) {
			if(checkIfPlayerAlreadyExists(event, data.player)) {
				utils.l.i("player already exists")
				return callback({ error: "Player is already in the event" }, null)
			} else {
				return callback(null, event)
			}
		},
		function (event, callback) {
			handleEventFull(event, callback)
		},
		function (event, callback) {
			event.players.push(data.player)
			setEventStatus(event)
			update(event, callback)
		}
	],
		function(err, event) {
			if (err) {
				return callback(err, null)
			} else {
				return callback(null, event)
			}
		}
	)
}

function listEvents(callback) {
	Event.find(function(err, events) {
		if (err) {
			return callback(err, null)
		} else {
			return callback(null, events)
		}
	})
}

module.exports = {
	model: Event,
	createEvent: createEvent,
	joinEvent: joinEvent,
	listEvents: listEvents
}