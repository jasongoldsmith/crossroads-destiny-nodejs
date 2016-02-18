var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var utils = require('../../../utils')
var models = require('../../../models')

function create(req, res) {
	utils.l.i("Event create request: " + JSON.stringify(req.body))
	createEvent(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err)
		} else {
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function createEvent(data, callback) {
	models.event.createEvent(data, callback)
}

routeUtils.rPost(router, '/create', 'create', create)
module.exports = router