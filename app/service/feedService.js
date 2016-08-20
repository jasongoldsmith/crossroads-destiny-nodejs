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
			models.event.getByQueryLean({clanId: user.clanId,consoleType: consoleType},null, callback)
		},function(events,callback) {
			eventsList = events
			//get unique activityIds across all events
			var activityIds = utils._.uniq(utils._.map(events, 'eType'))

			//get unique playerIds across all events, players is an array in event. Flatten before getting uniq set.
			playerIds = utils._.map(events, 'players')
			playerIds = utils._.uniq(utils._.flatten(playerIds))

			models.activity.getByQuery({"_id": {"$in": activityIds}}, callback)
		},function(activities,callback) {
			//lookup activities and create activities hashmap
			activitiesMap = utils._.keyBy(activities, function (activity) {
				return activity._id
			})

			models.user.getByQueryLite({"_id":{"$in":playerIds}},"-passWord -groups -stats -legal",callback)
		},function(players,callback){
			//lookup players from user objectand create players map
			var playersMap = utils._.keyBy(players,function(player){
				return player._id
			})

			//run through all events, merge full objects for eType i.e. activity, creator, players using maps created
			utils._.map(eventsList, function(event){
				event.eType = utils._.get(activitiesMap,event.eType)
				event.creator = utils._.get(playersMap,event.creator)
				var playerList = utils._.map(event.players,function(playerId){
					return utils._.get(playersMap,playerId)
				})
				utils._.assign(event.players, playerList)
				return event
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