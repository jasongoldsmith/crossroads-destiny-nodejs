var express = require('express')
var router = express.Router()
var config = require('config')
var utils = require('../../utils')
var helpers = require('../../helpers')
var routeUtils = require('../routeUtils')
var models = require('../../models')
var service = require('../../service/index')
var passport = require('passport')
var passwordHash = require('password-hash')

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
            return callback(err, null)
          }
          if (!user) {
            return callback(new helpers.errors.WError('PhoneNo or Password incorrect'), null)
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

function boLogin (req, res) {
  req.assert('userName', "Name must be between 1 and 50 alphanumeric, alpha if one character, no special characters/space").notEmpty().isName()
  req.assert('passWord', "Name must be between 1 and 50 alphanumeric, alpha if one character, no special characters/space").notEmpty().isAlphaNumeric()
  console.log("In boLogin")
  var outerUser = null
  utils.async.waterfall(
    [
      helpers.req.handleVErrorWrapper(req),
      function(callback) {
        var passportHandler = passport.authenticate('local', function(err, user, info) {
          if (err) {
            return callback(err)
          }
          var userType = JSON.parse(JSON.stringify(user)).userType
          console.log("userType from passport "+userType)
          if (!user) {
            return callback(new helpers.errors.WError('PhoneNo or Password incorrect'))
          }else if(user && userType != 'admin'){
            return callback(new helpers.errors.WError('User Not Authorized'))
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
};

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
    xboxId: body.xboxId,
    imageUrl: body.imageUrl,
    clanId: body.clanId
  }

  utils.async.waterfall([
      helpers.req.handleVErrorWrapper(req),
      function (callback) {
        service.authService.signupUser(userData, callback)
      },
      reqLoginWrapper(req, "auth.login")
    ],
    function (err, user) {
      if (err) {
        req.routeErr = err
        return routeUtils.handleAPIError(req, res, err)
      }
      helpers.cookies.setCookie("foo", "bar", res)
      helpers.m.setUser(user)
      return routeUtils.handleAPISuccess(req, res, {value: user})
    }
  )
}

function verifyAccount(req,res){
  //var id = req.param("id");
  var token = req.param("token");
  //var name = req.param("name");
  //console.log("id="+id+",token="+token+",name="+name)
  utils.l.d("verifyAccount::token="+token)
//  req.assert('id', "Invalid verification link. Please click on the link sent to you or copy paste the link in a browser.").notEmpty()
  req.assert('token', "Invalid verification link. Please click on the link sent to you or copy paste the link in a browser.").notEmpty()
//  req.assert('name', "Invalid verification link. Please click on the link sent to you or copy paste the link in a browser.").notEmpty()
  utils.async.waterfall([
    function(callback){
      //models.user.getUserByData({userName:name},callback)
      models.user.getUserByData({psnToken:token},callback)
    },function(user, callback){
        utils.l.d("user="+user)
      //if(user && ((user.psnId == id || user.xboxId == id) && user.psnToken == token)){
      if(user){
        user.psnVerified = "VERIFIED"
        models.user.save(user,function(err,updatedUser){
          callback(null, "Your account has been verified and its now active.")
        })
      }else{
        callback("Invalid verification link. Please click on the link sent to you or copy paste the link in a browser.",null)
      }
    }
  ],
    function (err, successResp){
      if(err) routeUtils.handleAPIError(req,res,err)
      else routeUtils.handleAPISuccess(req, res, successResp)
    }
  )
}

function logout(req, res) {
  req.logout()
  routeUtils.handleAPISuccess(req, res, {success: true})
}

/** Routes */
routeUtils.rGetPost(router, '/login', 'Login', login, login)
routeUtils.rGetPost(router, '/bo/login', 'BOLogin', boLogin, boLogin)
routeUtils.rPost(router, '/register', 'Signup', signup)
routeUtils.rPost(router, '/logout', 'Logout', logout)
routeUtils.rGet(router, '/verify/:token', 'AccountVerification', verifyAccount)
module.exports = router

