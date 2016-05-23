var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var utils = require('../../../utils')
var helpers = require('../../../helpers')

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

	if(data.trackingKey == "pushNotification") {
		if(utils._.isInvalidOrBlank(data.trackingData.notificationName)) {
			return callback({error: "notification name cannot be null"}, null)
		}
		var key = data.trackingData.notificationName

		try {
			helpers.m.trackRequest(key, data.trackingData, req, user)
		} catch (ex) {
			return callback({error: ex}, null)
		}
		return callback(null, {success: true})
	} else {
		return callback({error: "Tracking for this object is not supported yet"}, null)
	}
}

routeUtils.rPost(router, '/track', 'track', track)
module.exports = router