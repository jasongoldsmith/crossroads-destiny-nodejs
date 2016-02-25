var express = require('express')
var router = express.Router()
var config = require('config')
var utils = require('../../utils')
var helpers = require('../../helpers')
var routeUtils = require('../routeUtils')
var models = require('../../models')

function create(req, res) {
	utils.l.i("Activity create request: " + JSON.stringify(req.body))
	createActivity(req.body, function(err, activity) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, activity)
		}
	})
}

function list(req, res) {
	utils.l.i("Activity list request")
	listActivities(function(err, activities) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, activities)
		}
	})
}

function listById(req, res) {
	utils.l.i("Get activity by id request" + JSON.stringify(req.body))
	listActivityById(req.body, function(err, activity) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, activity)
		}
	})
}

function createActivity(data, callback) {
	models.activity.createActivity(data, callback)
}

function listActivities(callback) {
	models.activity.listActivities(callback)
}

function listActivityById(data, callback) {
	models.activity.listActivityById(data, callback)
}

routeUtils.rPost(router, '/create', 'create', create)
routeUtils.rGet(router, '/list', 'list', list)
routeUtils.rPost(router, '/listById', 'listById', listById)
module.exports = router