var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')

function getFeed(user, consoleType, isPublicFeed, createMyEventsList, callback) {
	var activitiesMap = null
	var playerIds = []
	var eventsList = []
	utils.async.waterfall([
		function(callback){
			var query = {}
			if(utils._.isInvalidOrBlank(user))
				query.clanId = utils.constants.freelanceBungieGroup.groupId
			else
				query.clanId = user.clanId

			// Fetch base event object with activity and playerIds
			if(utils._.isInvalidOrBlank(consoleType) && utils._.isValidNonBlank(user)) {
				query.consoleType = utils.primaryConsole(user).consoleType
			}

			if(isPublicFeed) {
				query.launchStatus = utils.constants.eventLaunchStatusList.now
			}

			// for public feed user will be null
			if(user) {
				query.$or = [
					{status: {$ne: "full"}},
					{launchStatus: utils.constants.eventLaunchStatusList.upcoming},
					{players: user._id}
				]
			}

			utils.l.d("feed::query", query)
			models.event.getByQueryLean(query, callback)
		},
		function(events, callback) {
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
			var playersMap = utils._.keyBy(results.players, function(player) {
				return player._id
			})
			utils._.map(eventsList, function(event) {
				event.eType = utils._.get(activitiesMap, event.eType)
				event.creator = utils._.get(playersMap, event.creator)
				var playerList = []
				utils._.map(event.players, function(playerId) {
					var playerObj = utils._.get(playersMap, playerId)
					if(utils._.isValid(playerObj)) {
						/*
						We need to use a toObject since we compute isInvited later
						We need to have a new object to ensure that we don't impact that flag for each event
						 */
						playerList.push(playerObj.toObject())
					}
				})
				utils._.remove(event.players)
				utils._.assign(event.players, playerList)
			})

			addIsInvitedFlagToEventPlayers(eventsList, callback)
		},
		function(events, callback) {
			//create final feed object
			transformEventsToFeed(eventsList, isPublicFeed, user, createMyEventsList, callback)
		}
	], callback)
}

function transformEventsToFeed(events, isPublicFeed, user, createMyEventsList, callback) {
	utils.async.waterfall([
		function(callback) {
			//Fetch adcard activities
			if(isPublicFeed)
				return callback(null, null)
			else
				models.activity.listAdActivities(callback)
		},
		function(adActivities, callback) {
			//separate current and future events from event list
			var feedObject = getFeedList(events,user,createMyEventsList)

			//Create unique activityIds array from current events
			utils.l.d('feedService::isPublicFeed::' + isPublicFeed)
			var currentActivityIds = utils._.uniq(utils._.map(feedObject.currentEvents, 'eType._id'))
			utils.l.d('currentActivityIds', currentActivityIds)
			//Run through adcard activities usually 5-6 objects and remove the ones alrady prsent in currentActivityIds
			feedObject.adActivities = []
			if(!isPublicFeed) {
				utils._.map(adActivities, function (activity) {
					utils.l.d('activity._id::' + activity._id + "  ###" + utils._.find(currentActivityIds, activity._id))
					if (!utils._.find(currentActivityIds, activity._id))
						feedObject.adActivities.push(activity)
				})
			}
			if(isPublicFeed) {
				models.user.findUserCount({"consoles.verifyStatus":"VERIFIED"}, function(err, userCount) {
					utils.l.d('feedService::totalUsers::' + userCount)
					utils.l.d('feedService::totalUsers::err', err)
					if(userCount > 0) {
						feedObject.totalUsers = userCount.toString()
						utils.l.d('feedService::totalUsers::feedObject.totalUsers' + feedObject.totalUsers)
					}
					return callback(null, feedObject)
				})
			} else {
				return callback(null, feedObject)
			}
		}
	], callback)
}

function getFeedList(events,user,createMyEventsList) {
	var feedObject = {}
	if(createMyEventsList && createMyEventsList == "true") {
		feedObject.currentEvents = utils._.filter(events, function (eventObj) {
			return (eventObj.launchStatus == "now" && utils._.findIndex(utils._.map(eventObj.players,"_id"), user._id) < 0)
		})
		feedObject.currentEvents = utils._.orderBy(feedObject.currentEvents, ['updated'], ['desc'])
		feedObject.myCurrentEvents = utils._.filter(events, function (eventObj) {
			return (eventObj.launchStatus == "now" && utils._.findIndex(utils._.map(eventObj.players,"_id"), user._id) >= 0)
		})
		feedObject.myCurrentEvents = utils._.orderBy(feedObject.myCurrentEvents, ['updated'], ['desc'])
		feedObject.futureEvents = utils._.filter(events, function (eventObj) {
			return (eventObj.launchStatus == "upcoming" && utils._.findIndex(utils._.map(eventObj.players,"_id"), user._id) < 0)
		})
		feedObject.myFutureEvents = utils._.filter(events, function (eventObj) {
			return (eventObj.launchStatus == "upcoming" && utils._.findIndex(utils._.map(eventObj.players,"_id"), user._id) >= 0)
		})
	}else{
		feedObject.currentEvents = utils._.filter(events, {launchStatus: "now"})
		feedObject.currentEvents = utils._.orderBy(feedObject.currentEvents, ['updated'], ['desc'])
		feedObject.futureEvents = utils._.filter(events, {launchStatus: "upcoming"})
	}
	return feedObject
}

function addIsInvitedFlagToEventPlayers(events, callback) {
	utils.async.waterfall([
		function (callback) {
			getEventsInvitations(events, callback)
		},
		function (eventsInvitationList, callback) {
			utils.async.map(events, function(event) {
				var eventInvitations = utils._.filter(eventsInvitationList, function (invitation) {
					return invitation.event.toString() == event._id.toString()
				})

				if(utils._.isValidNonBlank(eventInvitations)) {
					utils.async.map(event.players, function (player) {
						player.isInvited = utils._.some(eventInvitations, {invitee: player._id})
					})
				}
			})
			return callback(null, events)
		}
	], callback)
}

function getEventsInvitations(events, callback) {
	models.eventInvitation.getByQueryLean({event: {$in: utils._.uniq(utils._.map(events, '_id'))}}, callback)
}

module.exports = {
	getFeed: getFeed
}