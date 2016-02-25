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

function createActivity(data, callback) {
	models.activity.createActivity(data, function(err, newActivity) {
		if (err) {
			return callback(err, null)
		} else {
			return callback(null, newActivity)
		}
	})
}

function listActivities(callback) {
	models.activity.listActivities(callback)
}

routeUtils.rPost(router, '/create', 'create', create)
routeUtils.rGet(router, '/list', 'list', list)
module.exports = router