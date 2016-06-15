var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var models = require('../../../models')
var utils = require('../../../utils')
var service = require('../../../service')
var passwordHash = require('password-hash')

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
  utils.l.i("Update user group request" + JSON.stringify(req.body))

  if(!req.body.id || !req.body.clanId) {
    var err = {
      error: "Id and ClanId are required fields"
    }
    routeUtils.handleAPIError(req, res, err, err)
  }else {
    updateUserGroup(req.body, function (err, user) {
      if (err) {
        routeUtils.handleAPIError(req, res, err, err)
      } else {
        routeUtils.handleAPISuccess(req, res, {value: user})
      }
    })
  }
}

function updatePassword(req, res) {
  utils.l.i("Update user password request" + JSON.stringify(req.body))


  if(!req.body.id || !req.body.oldPassWord || !req.body.newPassWord) {
    var err = {
      error: "id, old password and new password are required fields"
    }
    routeUtils.handleAPIError(req, res, err, err)
  } else {

    try {
      req.assert('newPassWord').notEmpty().isAlphaNumeric()
    } catch(ex) {
      var err = {
        error: "password must be between 1 and 9 characters and must be alphanumeric"
      }
      return routeUtils.handleAPIError(req, res, err, err)
    }

    updateUserPassword(req.body, function (err, user) {
      if (err) {
        routeUtils.handleAPIError(req, res, err, err)
      } else {
        routeUtils.handleAPISuccess(req, res, user)
      }
    })
  }
}

function getUserMetrics(req, res) {
  utils.l.i("Get user metrics request")
  models.user.getUserMetrics(function(err, metrics) {
    if(err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, metrics)
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
  models.user.updateUser(data, false, callback)
}

//TODO: GroupID is set in clanID field. Need to change it later.
function updateUserGroup(data, callback) {
  models.user.updateUser({id: data.id, clanId: data.clanId}, true, callback)
}

function updateUserPassword(data, callback) {
  utils.async.waterfall([
    function(callback) {
      getUserById(data, callback)
    },
    function(user, callback) {

      if (!passwordHash.verify(data.oldPassWord, user.passWord)) {
        return callback({error: "old password entered does not match the password in our records"}, null)
      }

      if (data.oldPassWord == data.newPassWord) {
        return callback({error: "new password has to be different from the old password"}, null)
      }

      data.passWord = data.newPassWord
      updateUser(data, callback)
    }
  ], callback)
}

routeUtils.rGet(router, '/self', 'GetSelfUser', getSelfUser)
routeUtils.rGet(router, '/list', 'list', list)
routeUtils.rPost(router, '/listById', 'listById', listById)
routeUtils.rPost(router, '/update', 'update', update)
routeUtils.rPost(router, '/updateGroup', 'updateGroup', updateGroup)
routeUtils.rPost(router, '/updatePassword', 'updatePassword', updatePassword)
routeUtils.rGet(router, '/getMetrics', 'getUserMetrics', getUserMetrics)
module.exports = router
