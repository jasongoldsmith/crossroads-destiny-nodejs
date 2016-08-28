var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')

function getFeed(user, consoleType, callback) {
	var activitiesMap = null
	var playerIds = []
	var eventsList = []
	utils.async.waterfall([
		function(callback){
			// Fetch base event object with activity and playerIds
			if(utils._.isInvalidOrBlank(consoleType)) {
				consoleType = utils.primaryConsole(user).consoleType
			}
			models.event.getByQueryLean({clanId: user.clanId,consoleType: consoleType}, callback)
		},
		function(events,callback) {
			eventsList = events
			var activityIds = utils._.uniq(utils._.map(events, 'eType'))
			playerIds = utils._.map(events, 'players')
			playerIds = utils._.uniq(utils._.flatten(playerIds))
			utils.async.parallel({
				activities: function (callback) {
					models.activity.getByQuery({"_id": {"$in": activityIds}}, callback)
				},
				players: function (callback) {
					models.user.getByQueryLite({"_id": {"$in": playerIds}}, "-passWord -groups -stats -legal", callback)
				}
			},
				function (err, results) {
					if(err) {
						utils.l.s("There was an error in fetching users and activities", err)
						return callback({error: "We are experiencing some issues. Please try again later"}, null)
					}
					else {
						return callback(null, results)
					}
			})
		},
		function(results, callback) {
			activitiesMap = utils._.keyBy(results.activities, function (activity) {
				return activity._id
			})
			var playersMap = utils._.keyBy(results.players,function (player) {
				return player._id
			})
			utils._.map(eventsList, function(event){
				event.eType = utils._.get(activitiesMap,event.eType)
				event.creator = utils._.get(playersMap,event.creator)
				var playerList = []
				utils._.map(event.players,function(playerId){
					var playerObj = utils._.get(playersMap,playerId)
					if(utils._.isValid(playerObj)){
						playerList.push(playerObj)
					}
				})
				utils._.remove(event.players)
				utils._.assign(event.players,playerList)
			})

			//create final feed object
			transformEventsToFeed(eventsList,callback)
		}
	],callback)
}

function transformEventsToFeed(events,callback){
	utils.async.waterfall([
		function(callback){
			//Fetch adcard activities
			models.activity.listAdActivities(callback)
		},function(adActivities,callback){
			//separate current and future events from event list
			var feedObject = {}
			feedObject.currentEvents = utils._.filter(events, {launchStatus: "now"})
			feedObject.futureEvents = utils._.filter(events, {launchStatus: "upcoming"})

			//Create unique activityIds array from current events
			var currentActivityIds = utils._.uniq(utils._.map(feedObject.currentEvents, 'eType._id'))
			utils.l.d('currentActivityIds',currentActivityIds)

			//Run through adcard activities usually 5-6 objects and remove the ones alrady prsent in currentActivityIds
			feedObject.adActivities = []
			utils._.map(adActivities,function(activity){
				utils.l.d('activity._id::'+activity._id+"  ###"+utils._.find(currentActivityIds,activity._id))
				if(!utils._.find(currentActivityIds,activity._id))
					feedObject.adActivities.push(activity)
			})

			callback(null,feedObject)
		}
	],callback)
}

// TODO: remove old feed after testing new one.
function getFeedV1(user, consoleType, callback) {
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

// TODO: remove when old feed is removed.
function getAdActivites(callback) {
	models.activity.listAdActivities(callback)
}

// TODO: remove when old feed is removed.
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