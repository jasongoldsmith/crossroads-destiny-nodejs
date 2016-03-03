var express = require('express')
var router = express.Router()
var config = require('config')
var utils = require('../../utils')
var helpers = require('../../helpers')
var routeUtils = require('../routeUtils')
var models = require('../../models')
var passport = require('passport')
var passwordHash = require('password-hash')

var platform = {
  ios : "ios",
  android: "android"
}
var MESSAGE_APP_UPTODATE = "app upto date"



function login (req, res) {
  req.assert('userName', "Name must be between 1 and 50 alphanumeric, alpha if one character, no special characters/space").notEmpty().isName()
  req.assert('passWord', "Name must be between 1 and 50 alphanumeric, alpha if one character, no special characters/space").notEmpty().isAlphaNumeric()

  var outerUser = null
  utils.async.waterfall(
    [
      helpers.req.handleVErrorWrapper(req),
      function(callback) {
        var passportHandler = passport.authenticate('local', function(err, user, info) {
          if (err) {
            return callback(err)
          }
          if (!user) {
            return callback(new helpers.errors.WError('PhoneNo or Password incorrect'))
          }
          outerUser = user
          callback(null, user)
        })
        passportHandler(req, res)
      },
      reqLoginWrapper(req, "auth.login")
    ],
    function (err) {
      if (err) {
        if (err instanceof helpers.errors.ValidationError) {
          req.routeErr = err
        } else {
          req.routeErr = new helpers.errors.WError(err, 'the input auth combination is not valid')
        }
        return routeUtils.handleAPIError(req, res, req.routeErr)
      }

      routeUtils.handleAPISuccess(req, res, {value: outerUser})
    }
  )
}

function addLogin(userId, userIp, userAgent, reason, callback) {
  utils.async.waterfall([
    function (callback) {
      models.user.getById(userId, callback)
    },
    function(user, callback) {
      var login = {
        userIp: userIp,
        userAgent: userAgent,
        reason: reason
      }
      // user.logins.values.push(login)
      models.user.save(user, callback)
    }], callback)
}

function reqLoginWrapper(req, reason) {
  return function (user, callback) {
    utils.async.waterfall(
      [
        function (callback) {
          req.logIn(user, callback)
        },
        function(callback) {
          addLogin(user.id, req.adata.ip, req.adata.user_agent, reason, callback)
        }
      ],
      callback
    )
  }
}

function signup(req, res) {
  req.assert('userName', "Name must be between 1 and 50 alphanumeric, alpha if one character, no special characters/space").notEmpty().isName()
  req.assert('passWord', "Name must be between 1 and 50 alphanumeric, alpha if one character, no special characters/space").notEmpty().isAlphaNumeric()
  var body = req.body
  var userData = {
    userName: body.userName.toLowerCase(),
    passWord: passwordHash.generate(body.passWord),
    psnId: body.psnId,
    xboxId: body.xboxId
  }
  utils.async.waterfall([
      helpers.req.handleVErrorWrapper(req),
      function(callback) {
        models.user.createUserFromData(userData, callback)  // don't send message
      },
      reqLoginWrapper(req, "auth.signup")
    ],
    function (err, user) {
      if (err) {
        req.routeErr = err
        return routeUtils.handleAPIError(req, res, err)
      }
      helpers.cookies.setCookie("foo", "bar", res)
      return routeUtils.handleAPISuccess(req, res, {value: user})
    }
  )
}



function logout(req, res) {
  req.logout()
  routeUtils.handleAPISuccess(req, res, {success: true})
}



/** Routes */
routeUtils.rGetPost(router, '/login', 'Login', login, login)

routeUtils.rPost(router, '/register', 'Signup', signup)

routeUtils.rPost(router, '/logout', 'Logout', logout)

module.exports = router
