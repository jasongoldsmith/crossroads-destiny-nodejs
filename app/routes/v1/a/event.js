var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var utils = require('../../../utils')
var models = require('../../../models')

function create(req, res) {
	utils.l.i("Event create request: " + JSON.stringify(req.body))
	createEvent(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function join(req, res) {
	utils.l.i("Event join request: " + JSON.stringify(req.body))
	joinEvent(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function list(req, res) {
	utils.l.i("Event list request")
	listEvents(function(err, events) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, events)
		}
	})
}

function leave(req, res) {
	utils.l.i("Event leave request: " + JSON.stringify(req.body))
	leaveEvent(req.body, function(err, event) {
		if (err) {
			routeUtils.handleAPIError(req, res, err, err)
		} else {
			routeUtils.handleAPISuccess(req, res, event)
		}
	})
}

function listEvents(callback) {
	models.event.listEvents(callback)
}

function createEvent(data, callback) {
	models.event.createEvent(data, callback)
}

function joinEvent(data, callback) {
	models.event.joinEvent(data, callback)
}

function leaveEvent(data, callback) {
	models.event.leaveEvent(data, callback)
}

routeUtils.rPost(router, '/create', 'create', create)
routeUtils.rPost(router, '/join', 'join', join)
routeUtils.rGet(router, '/list', 'list', list)
routeUtils.rPost(router, '/leave', 'leave', leave)
module.exports = router