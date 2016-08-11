var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')

function getFeed(user, consoleType, callback) {
	utils.async.waterfall([
		function (callback) {
			getEvents(user, consoleType, callback)
		},
		function (events, callback) {
			var feedObject = {}
			feedObject.currentEvents = utils._.filter(events, {launchStatus: "now"})
			feedObject.futureEvents = utils._.filter(events, {launchStatus: "upcoming"})
			getAdActivites(function(err, adActivities) {
				feedObject.adActivities = removeAdActivitiesOfEvents(feedObject.currentEvents, adActivities)
				return callback(null, feedObject)
			})
		}
	], callback)
}

function getEvents(user, consoleType, callback) {
	if(utils._.isInvalidOrBlank(consoleType)) {
		consoleType = utils.primaryConsole(user).consoleType
	}

	models.event.getByQuery(
		{
			clanId: user.clanId,
			consoleType: consoleType
		},
		null, callback)
}

function getAdActivites(callback) {
	models.activity.listAdActivities(callback)
}

function removeAdActivitiesOfEvents(events, adActivities) {
	var adActivitiesList = []
	utils._.forEach(adActivities, function (adActivity) {
		var didMatch = false
		utils._.forEach(events, function (event) {
			if(adActivity._id.toString() == event.eType._id.toString()) {
				didMatch = true
			}
		})
		if(!didMatch) {
			adActivitiesList.push(adActivity)
		}
	})
	return adActivitiesList
}

module.exports = {
	getFeed: getFeed
}