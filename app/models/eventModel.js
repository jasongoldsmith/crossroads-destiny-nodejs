var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')

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
				eventObj.save(callback)
			} else {
				event.players.push(data.creator)
				callback(null, event)
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