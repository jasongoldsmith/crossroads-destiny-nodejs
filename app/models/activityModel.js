var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')

// Activity Schema
var activitySchema = require('./schema/activitySchema')

// Model initialization
var Activity = mongoose.model('Activity', activitySchema.schema)

function createActivity(data, callback) {
	var activityObj = new Activity(data)
	Activity.findOne({aType: data.aType, aSubType: data.aSubType, aCheckpoint: data.aCheckpoint, aDifficulty: data.aDifficulty}, function(err, activity) {
		if (err) {
			utils.l.i("found err " + err)
			return callback(err)
		} else if (!activity) {
				activityObj.save(function (err, newActivity) {
					if (err) {
						return callback(err)
					} else {
						return callback(null, newActivity)
					}
				})
			} else {
				utils.l.i("found activity: " + activity)
				return callback(null, activity)
			}
	})
}

function listActivities(callback) {
	Activity.find(function(err, activities) {
		if (err) {
			return callback(err, null)
		} else {
			return callback(null, activities)
		}
	})
}

module.exports = {
	model: Activity,
	createActivity: createActivity,
	listActivities: listActivities
}