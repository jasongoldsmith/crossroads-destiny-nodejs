var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')

// Activity Schema
var activitySchema = require('./schema/activitySchema')

// Model initialization
var Activity = mongoose.model('Activity', activitySchema.schema)

function createActivity(data, callback) {
	var activityObj = new Activity(data)
	utils.async.waterfall([
		function (callback) {
			Activity.findOne({aType: data.aType, aSubType: data.aSubType, aCheckpoint: data.aCheckpoint, aDifficulty: data.aDifficulty}, callback)
		},
		function (activity, callback) {
			if (!activity) {
				utils.l.i("no activity found, saving activity")
				activityObj.save(callback)
			} else {
				utils.l.i("found activity: " + activity)
				return callback(null, activity)
			}
		}
	], callback)
}

function listActivities(callback) {
	Activity.find({ isActive : {$ne: false} }, callback)
}

function listAllActivities(callback) {
	Activity.find(callback)
}

function listActivityById(data, callback) {
	utils.async.waterfall([
		function (callback) {
			Activity.findOne({_id: data.id}, callback)
		},
		function(activity, callback) {
			if (!activity) {
				utils.l.i("no activity found")
				return callback({ error: "activity with this id does not exist" }, null)
			} else {
				utils.l.i("found activity: " + JSON.stringify(activity))
				return callback(null, activity)
			}
		}
	], callback)
}

function updateActivity(data, callback) {
	utils.async.waterfall([
		function (callback) {
			Activity.findOne({_id: data.id}, callback)
		},
		function(activity, callback) {
			if (!activity) {
				utils.l.i("no activity found")
				return callback({ error: "activity with this id does not exist" }, null)
			} else {
				utils.l.i("found activity: " + JSON.stringify(activity))
				utils._.extend(activity, data)
				activity.save(callback)
			}
		}
	], callback)
}

module.exports = {
	model: Activity,
	createActivity: createActivity,
	listActivities: listActivities,
	listAllActivities: listAllActivities,
	listActivityById: listActivityById,
	updateActivity: updateActivity
}