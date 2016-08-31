var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var utils = require('../../../utils')
var helpers = require('../../../helpers')
var models = require('../../../models')

function track(req, res) {
	utils.l.d("data track request: " + JSON.stringify(req.body))
	trackData(req, function(err, result) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, result)
		}
	})
}

function trackData(req, callback) {
	var data = req.body
	var user = req.user

	utils.async.waterfall([
		function(callback) {
			if(!data.trackingData) {
				data.trackingData = {}
			}

			switch(data.trackingKey) {
				case "pushNotification":
					trackPushNotification(data, callback)
					break
				case "appInstall":
					trackAppInstall(req, data, callback)
					break
				case "appInit":
					trackAppInit(req, data, callback)
					break
				case "signupInit":
					trackSignupInit(req, data, callback)
					break
				case "eventSharing":
					trackEventSharing(req.user, data, callback)
					break
				case "addCardInit":
					trackAdCardInit(req.user, data, callback)
					break
				default:
					return callback(null, null)
					break
			}
		}
	],
	function (err, key) {
		if(err) {
			return callback(err, null)
		} else {
			try {
				helpers.m.trackRequest(key, data.trackingData, req, user)
			} catch (ex) {
				return callback(null, {success: true})
			}
			return callback(null, {success: true})
		}
	})
}

function trackPushNotification(data, callback) {
	if(utils._.isInvalidOrBlank(data.trackingData.notificationName)) {
		return callback({error: "notification name cannot be null for notification tracking"}, null)
	} else {
		return callback(null, data.trackingData.notificationName)
	}
}

function trackAppInstall(req, data, callback) {
	var userId = data.trackingData.userId
	if(utils._.isValidNonBlank(userId)) {
		req.zuid = userId
		req.session.zuid = userId
	}
	data.trackingData.userId = req.session.zuid

	// expecting trackingData.ads to be in the format "/<source>/<campaign>/<ad>/<creative>?sasda"
	// We have to maintain this order as it is sent by fb and branch as a deep link
	var adsValues = data.trackingData.ads.split('/')
	adsValues[4] = adsValues[4].split('?')[0]
	data.trackingData.source = adsValues[1]
	data.trackingData.campaign = adsValues[2]
	data.trackingData.ad = adsValues[3]
	data.trackingData.creative = adsValues[4]

	helpers.m.setUser(req, data.trackingData)
	return callback(null, "appInstall")
}

function trackAppInit(req, data, callback) {
	data.trackingData.userId = req.session.zuid
	return callback(null, "appInit")
}

function trackSignupInit(req, data, callback) {
	data.trackingData.userId = req.session.zuid
	return callback(null, "signupInit")
}

function trackAdCardInit(user, data, callback) {
	data.trackingData.userId = user._id.toString()
	return callback(null, "adCardInit")
}

function trackEventSharing(user, data, callback) {
	utils.async.waterfall([
		function (callback) {
			if(!data.trackingData.eventId) {
				return callback({error: "eventId cannot be null for event sharing"}, null)
			}
			models.event.getById(data.trackingData.eventId, callback)
		},
		function(event, callback) {
			if(!event) {
				return callback({error: "No event with this id exists"}, null)
			}
			data.trackingData = {
				eventId: event._id.toString(),
				userId: user._id.toString(),
				isCurrentEventOwner: user._id.toString() == event.creator._id.toString(),
				playerCount: event.players.length
			}
			return callback(null, "eventSharing")
		}
	], callback)
}

routeUtils.rPost(router, '/track', 'track', track)
module.exports = router