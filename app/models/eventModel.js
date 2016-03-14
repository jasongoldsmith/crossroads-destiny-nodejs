var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')

// Activity Schema
var eventSchema = require('./schema/eventSchema')

// Model initialization
var Event = mongoose.model('Event', eventSchema.schema)


function getByQuery(query, callback) {
	Event
		.find(query)
		.populate("eType")
		.populate("creator", "-passWord")
		.populate("players", "-passWord")
		.exec(callback)
}

function getById(id, callback) {
	if (!id) return callback("Invalid id:" + id);
	getByQuery({'_id':id}, utils.firstInArrayCallback(callback));
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
	var playerAlreadyExists = utils._.some(event.players, function (player) {
		return player.toString() === data.toString()
	})

	return playerAlreadyExists
}

function handleNoEventFound(event, callback) {
	if (!event) {
		utils.l.d("no event found")
		return callback({ error: "No event was found" }, null)
	} else {
		return callback(null, event)
	}
}

function handleEventFull(event, callback) {
	if (event.status == "full") {
		utils.l.d("event is full")
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
		function (event, callback) {
			if (!event) {
				utils.l.d ("no event found, creating a new event")
				eventObj.save(callback)
			} else {
				if (checkIfPlayerAlreadyExists(event, data.creator)) {
					utils.l.d("player already exists, sending the event as it is")
					return callback(null, event)
				} else {
					handleEventFull(event, function (err, oldEvent) {
						if (err) {
							utils.l.d ("creating a new event")
							eventObj.save(callback)
						} else {
							utils.l.d("found an already existing event, adding the new player to the event")
							oldEvent.players.push(data.creator)
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
				getById(event._id, callback);
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
			if(checkIfPlayerAlreadyExists(event, data.player)) {
				utils.l.d("player already exists, sending the event as it is")
				return callback(null, event)
			} else {
				return callback(null, event)
			}
		},
		function(event, callback) {
			handleEventFull(event, callback)
		},
		function(event, callback) {
			event.players.push(data.player)
			update(event, callback)
		}
	],
		function(err, event) {
			if (err) {
				return callback(err, null)
			} else {
				getById(event._id, callback);
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
				return callback({ error: "player is not part of the event" }, null)
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
				update(event, callback)
			}
		}
	],
		function(err, event) {
			if (err) {
				return callback(err, null)
			} else {
				getById(event._id, callback);
			}
		}
	)
}

function listEvents(callback) {
	getByQuery({}, callback);
}

module.exports = {
	model: Event,
	createEvent: createEvent,
	joinEvent: joinEvent,
	listEvents: listEvents,
	leaveEvent: leaveEvent
}