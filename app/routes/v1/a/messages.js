var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var utils = require('../../../utils')
var models = require('../../../models')
var helpers = require('../../../helpers')

function send(req, res) {
	utils.l.d("Message send request: " + JSON.stringify(req.body))

	sendMessage(req.body, req.user, function(err, message) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, message)
		}
	})
}

function sendMessage(data, messageCreator, callback) {
	var eventObj = null
	utils.async.waterfall(
		[
			function(callback) {
				models.event.getById(data.eId, callback)
			},
			function (event, callback) {
				utils.l.d("Event to send in payload: " + JSON.stringify(event))
				if(utils._.isInvalidOrBlank(event)) {
					return callback({ error: "no event found" }, null)
				} else {
					eventObj = {
						event: event,
						playerMessage: true
					}
				}
				models.user.getUserById(data, callback)
			},
			function (user, callback) {
				models.installation.getInstallationByUser(user, callback)
			},
			function (installation, callback) {
				var message = messageCreator.psnId + " from " + eventObj.event.eType.aSubType + ": "  + data.message
				helpers.pushNotification.sendSinglePushNotification(eventObj, message, installation)
				return callback(null, { messageSent: data.message })
			}
		], callback)
}

routeUtils.rPost(router, '/send', 'send', send)
module.exports = router