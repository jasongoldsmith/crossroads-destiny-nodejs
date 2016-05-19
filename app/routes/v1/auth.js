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
            return callback({error: "Password is incorrect"}, null)
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
          req.routeErr = {error: "the input auth combination is not valid"}
        }
        return routeUtils.handleAPIError(req, res, req.routeErr,req.routeErr)
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
            return callback({error: "Password is incorrect"}, null)
          }else if(user && userType != 'admin'){
            return callback({error: "User is not authorized"}, null)
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
          req.routeErr = {error: "the input auth combination is not valid"}
        }
        return routeUtils.handleAPIError(req, res, req.routeErr,req.routeErr)
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
        return routeUtils.handleAPIError(req, res, err,err)
      }
      helpers.cookies.setCookie("foo", "bar", res)
      helpers.m.setUser(user)
      return routeUtils.handleAPISuccess(req, res, {value: user,message:getSignupMessage(user)})
    }
  )
}

function verifyAccount(req,res){
  var token = req.param("token")
  models.user.getUserByData({psnToken:token},function(err, user){
    if(user){
      res.render("account/index",{
        token: token,
        psnId: user.psnId,
        appName:"TRVLR"
      })
    }else{
      res.render("account/error")
    }
  })
}

function verifyAccountConfirm(req,res){
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
          callback(null, utils.config.accountVerificationSuccess)
        })
      }else{
        callback("Invalid verification link. Please click on the link sent to you or copy paste the link in a browser.",null)
      }
    }
  ],
    function (err, successResp){
      if(err) routeUtils.handleAPIError(req,res,err,err)
      else routeUtils.handleAPISuccess(req, res, successResp)
    }
  )
}

function logout(req, res) {
  req.logout()
  routeUtils.handleAPISuccess(req, res, {success: true})
}

function getSignupMessage(user){
  if(user.psnVerified == "INITIATED") return "Thanks for signing up for Traveler, the Destiny Fireteam Finder mobile app! An account verification message has been sent to your bungie.net account. Click the link in the message to verify your PSN id."
  else return "Thanks for signing up for Traveler, the Destiny Fireteam Finder mobile app!"
}

function requestResetPassword(req,res){
  var psnId = req.body.psnId
  console.log("requestResetPassword::"+psnId)
  utils.async.waterfall([
      function (callback) {
        models.user.getUserByData({psnId:psnId},callback)
      },
      function(user,callback){
        if(user) {
          service.authService.requestResetPassword(user, callback)
        }else callback({error:"Invalid psnId. Please provide a valid psnId"})
      }
    ],
    function (err, updatedUser) {
      if (err) {
        return routeUtils.handleAPIError(req, res, err,err)
      }else  if(updatedUser && utils._.isEmpty(updatedUser.passwordResetToken)){
        var error =  {error:"Unable to process password reset request. Please try again later."}
        return routeUtils.handleAPIError(req, res,error,error)
      }else{
        return routeUtils.handleAPISuccess(req, res, updatedUser)
      }
    }
  )
}

function resetPasswordLaunch(req,res){
  var token = req.param("token")
  models.user.getUserByData({passwordResetToken:token},function(err, user){
    if(user){
      res.render("account/resetPassword",{
        token: token,
        psnId: user.psnId,
        userName: user.userName
      })
    }else{
      res.render("account/error")
    }
  })
}

function resetPassword(req,res){
  var userName = req.body.userName
  var newPassword = passwordHash.generate(req.body.passWord)
  console.log("resetPassword::"+userName)
  utils.async.waterfall([
      function (callback) {
        models.user.getUserByData({userName:userName},callback)
      },
      function(user,callback){
        if(user) {
          user.passWord = newPassword
          models.user.save(user, callback)
        }else callback({error:"Invalid username. Please provide a valid username"})
      }
    ],
    function (err, updatedUser) {
      if (err) {
        req.routeErr = err
        return res.render("Unable to reset password at this time. Please try again later.."+err)
      }
      return res.send("Congratulations your request has been processed successfully")
    }
  )
}
/** Routes */
routeUtils.rGetPost(router, '/login', 'Login', login, login)
routeUtils.rGetPost(router, '/bo/login', 'BOLogin', boLogin, boLogin)
routeUtils.rPost(router, '/register', 'Signup', signup)
routeUtils.rPost(router, '/logout', 'Logout', logout)
routeUtils.rGet(router, '/verifyconfirm/:token', 'AccountVerification', verifyAccountConfirm)
routeUtils.rGet(router, '/verify/:token', 'AccountVerification', verifyAccount)
routeUtils.rGet(router, '/resetPassword/:token', 'resetPasswordLaunch', resetPasswordLaunch, resetPasswordLaunch)
routeUtils.rPost(router, '/request/resetPassword', 'requestResetPassword', requestResetPassword, requestResetPassword)
routeUtils.rPost(router, '/resetPassword/:token', 'resetPassword', resetPassword, resetPassword)
module.exports = router

