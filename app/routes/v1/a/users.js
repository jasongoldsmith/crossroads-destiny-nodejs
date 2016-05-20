var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var models = require('../../../models')
var utils = require('../../../utils')
var service = require('../../../service')
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

function updateGroup(req, res) {
  utils.l.i("Update user request" + JSON.stringify(req.body))
  req.assert('clanId', "clanId is a required field").notEmpty()
  if(!req.body.id || !req.body.clanId) {
    routeUtils.handleAPIError(req, res, {error:"Id and ClanId are rquired fields"}, {error:"Id and ClanId are rquired fields"})
  }else {
    updateUserGroup(req.body, function (err, user) {
      if (err) {
        routeUtils.handleAPIError(req, res, err, err)
      } else {
        routeUtils.handleAPISuccess(req, res, user)
      }
    })
  }
}

function getUserById(data, callback) {
  models.user.getUserById(data, callback)
}

function listUsers(callback) {
  models.user.listUsers(callback)
}

function updateUser(data, callback) {
  models.user.updateUser(data, false,callback)
}

//TODO: GroupID is set in clanID field. Need to change it later.
function updateUserGroup(data, callback) {
  utils.async.waterfall([
    function(callback){
      service.eventService.clearEventsForPlayer(data.id,callback)
    },function(events,callback){
      models.user.updateUser({id:data.id,clanId:data.clanId}, true,callback)
    }
  ],callback)

}

routeUtils.rGet(router, '/self', 'GetSelfUser', getSelfUser)
routeUtils.rGet(router, '/list', 'list', list)
routeUtils.rPost(router, '/listById', 'listById', listById)
routeUtils.rPost(router, '/update', 'update', update)
routeUtils.rPost(router, '/updateGroup', 'updateGroup', updateGroup)
module.exports = router
