var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var utils = require('../../../utils')
var models = require('../../../models')
var helpers = require('../../../helpers')
var service = require('../../../service')

function getFeed(req, res) {
	utils.l.i("Get feed request for user: " + JSON.stringify(req.user)
		+ " with console type: " + req.param('consoleType'))
	service.feedService.getFeed(req.user, req.param('consoleType'), function(err, feed) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err, {utm_dnt:"list"})
		} else {
			routeUtils.handleAPISuccess(req, res, feed, {utm_dnt:"list"})
		}
	})
}

routeUtils.rGet(router, '/get', 'getFeed', getFeed, {utm_dnt:"androidAppVersion"})
module.exports = router