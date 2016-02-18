var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')
var lodash = require ('../utils/lodash')

// Activity Schema
var eventSchema = require('./schema/eventSchema')

// Model initialization
var Event = mongoose.model('Event', eventSchema.schema)

function createEvent(data, callback) {
	var eventObj = new Event(data)
	utils.async.waterfall([
		function (callback) {
			Event.findOne({eType: data.eType}, callback)
		},
		function (event, callback) {
			if (!event) {
				utils.l.i("no event found, creating a new event")
				eventObj.save(callback)
			} else {
				var playerAlreadyExists = lodash.some(event.players, function (player) {
					return player.toString() === data.creator.toString()
				})

				if (playerAlreadyExists) {
					return callback({ error: "Player is already in the event" }, null)
				} else if (event.status == "full") {
					utils.l.i("old event is full, creating a new event")
					eventObj.save(callback)
				} else {
					utils.l.i("found an already existing event, adding the new player to the event")
					event.players.push(data.creator)

					var size = event.players.length
					if (size == 1) {
						event.status = "new"
					} else if (size < event.minPlayers) {
						event.status = "open"
					} else if (size >= event.minPlayers && size < event.maxPlayers) {
						event.status = "can_join"
					} else {
						event.status = "full"
					}

					Event.update(event, function (err, data) {
						if (err) {
							return callback(err, null)
						} else {
							return callback(null, event)
						}
					})
				}
			}
		}
	],
		function(err, event) {
			if (err) {
				utils.l.i("found error: " + err)
				return callback(err, null)
			} else {
				return callback(null, event)
			}
		}
	)
}

module.exports = {
	model: Event,
	createEvent: createEvent
}