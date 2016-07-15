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

function listAll(req, res) {
	utils.l.i("Activity list all request")
	listAllActivities(function(err, activities) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, activities)
		}
	})
}

function listAd(req, res) {
	utils.l.i("Ad Activities list request")
	listAdActivities(function(err, activities) {
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

function update(req, res) {
	utils.l.i("Update activity request" + JSON.stringify(req.body))
	updateActivity(req.body, function(err, activity) {
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

function listAdActivities(callback) {
	models.activity.listAdActivities(callback)
}

function listAllActivities(callback) {
	models.activity.listActivities(callback)
}

function listActivityById(data, callback) {
	models.activity.listActivityById(data, callback)
}

function updateActivity(data, callback) {
	models.activity.updateActivity(data, callback)
}

routeUtils.rPost(router, '/create', 'create', create)
routeUtils.rGet(router, '/list', 'list', list)
routeUtils.rGet(router, '/listAd', 'listAdActivities', listAd)
routeUtils.rGet(router, '/listAll', 'listAll', listAll)
routeUtils.rPost(router, '/listById', 'listById', listById)
routeUtils.rPost(router, '/update', 'update', update)
module.exports = router