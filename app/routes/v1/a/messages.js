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
	utils.async.waterfall(
		[
			function (callback) {
				models.user.getUserById(data, callback)
			},
			function (user, callback) {
				models.installation.getInstallationByUser(user, callback)
			},
			function (installation, callback) {
				helpers.pushNotification.sendSinglePushNotification(null, messageCreator.userName + ": "  + data.message, installation)
				callback(null, { messageSent: data.message })
			}
		], callback)
}

routeUtils.rPost(router, '/send', 'send', send)
module.exports = router