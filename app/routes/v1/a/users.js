var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var models = require('../../../models')
var utils = require('../../../utils')

function getSelfUser(req, res) {
  var feedData = {value: req.user}
  routeUtils.handleAPISuccess(req, res, feedData)
}

function listById(req, res) {
  utils.l.i("Get user by id request" + JSON.stringify(req.body))
  getUserById(req.body, function(err, user) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, user)
    }
  })
}

function list(req, res) {
  utils.l.i("User list request")
  listUsers(function(err, users) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, users)
    }
  })
}

function update(req, res) {
  utils.l.i("Update user request" + JSON.stringify(req.body))
  updateUser(req.body, function(err, user) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, user)
    }
  })
}

function getUserById(data, callback) {
  models.user.getUserById(data, callback)
}

function listUsers(callback) {
  models.user.listUsers(callback)
}

function updateUser(data, callback) {
  models.user.updateUser(data, callback)
}

routeUtils.rGet(router, '/self', 'GetSelfUser', getSelfUser)
routeUtils.rGet(router, '/list', 'list', list)
routeUtils.rPost(router, '/listById', 'listById', listById)
routeUtils.rPost(router, '/update', 'update', update)

module.exports = router
