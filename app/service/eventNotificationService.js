var utils = require('../utils')
var models = require('../models')

function getNotificationDetails(event, notification, playerLeft, callback) {

	var notificationObj = {
		name: notification.name,
		message: formatMessage(notification.messageTemplate, event, playerLeft)
	}

	getRecipients(notification.recipientType, event, function(err, recipients) {
		if (err) {
			return callback(err, null)
		}
		notificationObj.recipients = recipients
		return callback(null, notificationObj)
	})
}

function formatMessage(messageTemplate, event, playerLeft) {
	messageTemplate =  messageTemplate
		.replace("creator", event.creator.psnId)
		.replace("eventName", getEventName(event.eType))

	if(utils._.isValidNonBlank(playerLeft)) {
		messageTemplate = messageTemplate.replace("player", playerLeft.psnId)
	} else {
		messageTemplate = messageTemplate.replace("player", event.players[event.players.length - 1].psnId)
	}

	var playersNeeded = event.maxPlayers - event.players.length
	messageTemplate = messageTemplate.replace("number", "" + playersNeeded)

	if(messageTemplate.indexOf("eventPlayers") >= 0 ) {
		var players = utils._.filter(event.players, function(player) {
			return player._id != event.creator._id
		})

		var playernames = (utils._.compact(utils._.map(players, function(player) {
			if(player.psnId != event.creator.psnId) {
				return player.psnId
			}
		}))).join(", ")

		messageTemplate = messageTemplate.replace("eventPlayers", playernames)
	}
	return messageTemplate
}

function getRecipients(recipientType, event, callback) {
	var recipients = null
	switch(recipientType) {
		case "creator":
			recipients = event.creator
			return callback(null, recipients)
			break
		case "eventMembers":
			recipients = event.players
			return callback(null, recipients)
			break
		case "eventMembersNotCreator":
			recipients = utils._.filter(event.players, function(player) {
				return player._id != event.creator._id
			})
			return callback(null, recipients)
			break
		case "clanNotEventMembers":
			getClanMembers(event, function(err, users) {
				if(err) {
					return callback(err, null)
				}
				recipients = removeEventPlayersFromClan(users, event.players)
				utils.l.i("recipients with callback", recipients)
				return callback(null, recipients)
			})
			break
		case "clan":
			getClanMembers(event, callback)
			break
	}
}

function getClanMembers(event, callback) {
	models.user.getByQuery({clanId: event.creator.clanId}, callback)
}

function removeEventPlayersFromClan(clanPlayers, eventPlayers) {
	utils.l.i("clan players", clanPlayers)
	utils.l.d("event players", eventPlayers)

	var recipients = []
	utils._.forEach(clanPlayers, function(clanPlayer) {
		var didMatch = false
		utils._.forEach(eventPlayers, function(eventPlayer) {
			if(clanPlayer._id.toString() == eventPlayer._id.toString()) {
				didMatch = true
			}
		})
		if(!didMatch) {
			recipients.push(clanPlayer)
		}
	})
	return recipients
}

function getEventName(activity) {
	var eventName = (utils._.compact([activity.aSubType, activity.aDifficulty])).join(" - ")
	if (utils._.isValidNonBlank(activity.aCheckpoint)) {
		eventName += ", " + activity.aCheckpoint
	}
	return eventName
}

module.exports = {
	getNotificationDetails: getNotificationDetails
}