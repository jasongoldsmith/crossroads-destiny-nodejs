var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var utils = require('../../../utils')
var models = require('../../../models')
var helpers = require('../../../helpers')
var service = require('../../../service')

function track(req, res) {
	utils.l.d("data track request: " + JSON.stringify(req.body))
	trackData(req.body, function(err, result) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, result)
		}
	})
}

function trackData(data, callback) {
	callback(null, {success: true})
}

routeUtils.rPost(router, '/track', 'track', track)
module.exports = router