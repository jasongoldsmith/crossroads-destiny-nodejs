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
  utils.l.d("Login request", req.body)
  var outerUser = null
    utils.async.waterfall(
    [
      helpers.req.handleVErrorWrapper(req),
      function(callback) {
        if(req.body.consoles) {
          req.body.consoles.consoleType = req.body.consoles.consoleType.toString().toUpperCase()
          req.body.consoles.consoleId = req.body.consoles.consoleId.toString().trim()
        }
        if(!req.body.userName) {
          req.body.userName = req.body.consoles.consoleId
        }
        utils.l.d('calling passport...')
        var passportHandler = passport.authenticate('local', function(err, user) {
          utils.l.d('passport.authenticate',user)
          if (err) {
            return callback(err, null)
          } else if (!user) {
            handleNewUser(req, callback)
          }else {
            return callback(null, user)
          }
        })
        passportHandler(req, res)
      },
      function (user, callback) {
        models.user.getById(user._id, function (err, user) {
          user.isLoggedIn = true
          if(req.body.consoles)
            service.userService.setPrimaryConsoleAndHelmet(user,req.body.consoles)
          var primaryConsole = utils.primaryConsole(user)
          if(utils._.isInvalidOrBlank(user.verifyStatus)){
            user.verifyStatus = primaryConsole.verifyStatus
            user.verifyToken = primaryConsole.verifyToken
          }
          service.authService.addLegalAttributes(user, function(err, data){
             outerUser = data
          })
          models.user.save(user, callback)
        })
      }
      ,reqLoginWrapper(req, "auth.login")
    ],
    function (err) {
      if (err) {
        return routeUtils.handleAPIError(req, res, err, err)
      }
      routeUtils.handleAPISuccess(req, res,
        {
          value: outerUser,
          message: getSignupMessage(outerUser)
        })
    }
  )
}

function handleNewUser(req, callback) {
  var body = req.body
  var bungieResponse = null
  utils.async.waterfall([
    function(callback) {
      service.userService.checkBungieAccount(body.consoles, callback)
    },
    function (bungieMember, callback) {
      bungieResponse = bungieMember
      models.user.getUserByData({bungieMemberShipId: bungieMember.bungieMemberShipId}, function(err, user) {
        if(err) {
          utils.l.s("Database lookup for user failed", err)
          return callback({error: "Something went wrong. Please try again"}, null)
        } else {
          return callback(null, user)
        }
      })
    },
    function(user, callback) {
      if(!user) {
        createNewUser(req, bungieResponse, callback)
      } else {
        if (!passwordHash.verify(body.passWord, user.passWord)) {
          return callback({error: "The username and password do not match our records."}, null)
        } else if((body.consoles.consoleType == 'PS3' && utils._.isValidNonBlank(utils.getUserConsoleObject(user, "PS4")))
          || (body.consoles.consoleType == 'XBOX360' && utils._.isValidNonBlank(utils.getUserConsoleObject(user, "XBOXONE")))) {
          return callback({error: "You cannot downgrade your console"}, null)
        } else {
          service.userService.refreshConsoles(user, bungieResponse, req.body.consoles, callback)
        }
      }
    }
  ], callback)
}

function createNewUser(req, bungieResponse, callback) {
  var body = req.body
  if(body.consoles.consoleType == "XBOX360" || body.consoles.consoleType == "PS3") {
    return({error: "We do not support old generation consoles anymore. " +
    "Please try again once you have upgraded to a new generation console"}, null)
  }
  var userData = {
    passWord: passwordHash.generate(body.passWord),
    clanId: body.clanId,
    mpDistinctId: req.adata.distinct_id,
    mpDistinctIdRefreshed:true
  }

  if(utils._.isValidNonBlank(bungieResponse)){
    consolesList =  []
    utils._.map(bungieResponse.destinyProfile,function(destinyAccount){
      var consoleObj = {}
      consoleObj.consoleType =  utils._.get(utils.constants.newGenConsoleType, destinyAccount.destinyMembershipType)
      consoleObj.destinyMembershipId = destinyAccount.destinyMembershipId
      consoleObj.consoleId=destinyAccount.destinyDisplayName
      consoleObj.clanTag=destinyAccount.clanTag
      consoleObj.imageUrl = utils.config.bungieBaseURL + "/" +destinyAccount.helmetUrl
      if(consoleObj.consoleType == body.consoles.consoleType)
        consoleObj.isPrimary = true
      else
        consoleObj.isPrimary = false
      consolesList.push(consoleObj)
    })
    userData.consoles = consolesList
    userData.bungieMemberShipId =  bungieResponse.bungieMemberShipId
  }
  utils.async.waterfall([
      helpers.req.handleVErrorWrapper(req),
      function(callback) {
        /* We need this call explicitly incase a new user is trying to
         create an account from a phone which already had this app */
        models.user.getOrCreateUIDFromRequest(req, true, callback)
      },
      function (uid, callback) {
        userData._id = uid
        service.authService.createNewUser(userData, callback)
      },
      reqLoginWrapper(req, "auth.login")
    ],
    function (err, user) {
      if (err) {
        utils.l.s("There was an error in creating the user", err)
        return callback(err, null)
      } else {
        helpers.firebase.createUser(user)
        helpers.m.updateUserJoinDate(req, user)
        return callback(null, user)
      }
    }
  )
}

function boLogin (req, res) {
  //req.assert('userName', "Name must be between 1 and 50 alphanumeric, alpha if one character, no special characters/space").notEmpty().isName()
  //req.assert('passWord', "Name must be between 1 and 50 alphanumeric, alpha if one character, no special characters/space").notEmpty().isAlphaNumeric()
  utils.l.d("In boLogin")
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
  try {
    req.assert('userName').notEmpty().isName()
  } catch(ex) {
    var err = {
      error: "username must be between 1 and 50 characters"
    }
    return routeUtils.handleAPIError(req, res, err, err)
  }

  try {
    req.assert('passWord').notEmpty().isAlphaNumeric()
  } catch(ex) {
    var err = {
      error: "password must be between 1 and 9 characters and must be alphanumeric"
    }
    return routeUtils.handleAPIError(req, res, err, err)
  }

  if(!req.body.consoles || utils._.isEmpty(req.body.consoles) || utils._.isInvalidOrBlank(req.body.consoles)){
    var err = {error: "Sorry, something's not right. Please go back to the sign up page and try entering your gamertag again."}
    return routeUtils.handleAPIError(req, res, err, err)
  }

  if(!req.body.bungieMemberShipId || utils._.isEmpty(req.body.bungieMemberShipId) ){
    var err = {error: "Sorry, something's not right. Please go back to the sign up page and try entering your gamertag again."}
    return routeUtils.handleAPIError(req, res, err, err)
  }

  var body = req.body

  var userData = {
    userName: body.userName.toLowerCase().trim(),
    passWord: passwordHash.generate(body.passWord),
    consoles: body.consoles,
    imageUrl: body.imageUrl,
    clanId: body.clanId,
    bungieMemberShipId: body.bungieMemberShipId,
    mpDistinctId: req.adata.distinct_id
  }

  utils.async.waterfall([
    helpers.req.handleVErrorWrapper(req),
    function(callback) {
      /* We need this call explicitly incase a new user is trying to
         create an account from a phone which already had this app */
      models.user.getOrCreateUIDFromRequest(req, true, callback)
    },
    function (uid, callback) {
      userData._id = uid
      service.authService.signupUser(userData, callback)
    },
    reqLoginWrapper(req, "auth.login")
  ],
    function (err, user) {
      if (err) {
        req.routeErr = err
        return routeUtils.handleAPIError(req, res, err,err)
      }
      helpers.firebase.createUser(user)
      helpers.cookies.setCookie("foo", "bar", res)
      helpers.m.updateUserJoinDate(req, user)
      return routeUtils.handleAPISuccess(req, res,
        {
          value: service.userService.setLegalAttributes(user),
          message: getSignupMessage(user)
        }
      )
    }
  )
}

function verifyAccount(req,res){
  var token = req.param("token")
  var query = { $or: [ { "consoles.verifyToken":token }, { "verifyToken":token } ] }
  models.user.getUserByData(query,function(err, user){
    if(user){
      var primaryConsole = utils.primaryConsole(user)
      res.render("account/index",{
        token: token,
        consoleId: primaryConsole.consoleId,
        consoleType: utils._.get(utils.constants.consoleGenericsId, primaryConsole.consoleType),
        appName:utils.config.appName,
        userName:user.userName
      })
    }else{
      res.render("account/error")
    }
  })
}

function verifyConfirm(req,res){
  var token = req.param("token")
  var userObj = null
  utils.l.d("verifyAccount::token="+token)
  //req.assert('token', "Invalid verification link. Please click on the link sent to you or copy paste the link in a browser.").notEmpty()
  utils.async.waterfall([
    function(callback){
      var query = { $or: [ { "consoles.verifyToken":token }, { "verifyToken":token } ] }
      models.user.getUserByData(query,callback)
    },function(user, callback){
      utils.l.d("user="+user)
      if(user){
        userObj = user
        user.verifyStatus ="VERIFIED"
        utils._.map(user.consoles,function(console){
          //if(console.verifyToken == token)
          console.verifyStatus ="VERIFIED"
        })
        models.user.save(user,function(err,updatedUser){
          callback(null, utils.config.accountVerificationSuccess)
        })
      }else{
        callback("Invalid verification link. Please click on the link sent to you or copy paste the link in a browser.",null)
      }
    }],
    function (err, successResp){
      if(err) routeUtils.handleAPIError(req,res,err,err)
      else {
        helpers.firebase.updateUser(userObj)
        helpers.m.trackRequest("AccountVerifyConfirm_SUCC", {"distinct_id":userObj.mpDistinctId}, req, userObj)
        res.render("account/verifyConfirm",{appName:utils.config.appName})
      }
    })
}

function markUserVerified(token,callback){
  var userObj = null
  utils.async.waterfall([
    function(callback){
      var query = { $or: [ { "consoles.verifyToken":token }, { "verifyToken":token } ] }
      models.user.getUserByData(query,callback)
    },function(user, callback){
      utils.l.d("user="+user)
      if(user){
        userObj = user
        user.verifyStatus ="VERIFIED"
        utils._.map(user.consoles,function(console){
          //if(console.verifyToken == token)
          console.verifyStatus ="VERIFIED"
        })
        models.user.save(user,function(err,updatedUser){
          callback(null, utils.config.accountVerificationSuccess)
        })
      }else{
        callback("Invalid verification link. Please click on the link sent to you or copy paste the link in a browser.",null)
      }
    }
  ],callback)
}

function verifyReject(req,res){
  var token = req.param("token")
  utils.l.d("verifyReject::token=" + token)
  //req.assert('token', "Invalid verification link. Please click on the link sent to you or copy paste the link in a browser.").notEmpty()
  var userObj = null
  utils.async.waterfall([
    function(callback) {
      var query = { $or: [ { "consoles.verifyToken":token }, { "verifyToken":token } ] }
      models.user.getUserByData(query,callback)
    },function(user, callback) {
      utils.l.d("user= " + user)
      if(user) {
        user.verifyStatus ="DELETED"
        handleInvalidUser(user,callback)
      } else {
        callback("Invalid verification link. Please click on the link sent to you or copy paste the link in a browser.", null)
      }
    }
  ],
    function (err, userDeleted) {
      if(err) routeUtils.handleAPIError(req, res, err, err)
      else {
        helpers.firebase.updateUser(userDeleted)
        res.writeHead(302, {'Location': 'http://w3.crossroadsapp.co/'})
        res.end()
      }
    }
  )
}

function handleInvalidUser(user,callback){
  utils.async.waterfall([
    function(callback){
      utils._.map(user.consoles,function(console){
        console.verifyStatus ="DELETED"
      })
      user.verifyStatus="DELETED"
      callback(null,user)
    },function(userToDelete, callback){
      service.eventService.clearCommentsByUser(user,callback)
    },function(eventsUpdated,callback){
      service.eventService.clearEventsForPlayer(user,null,null,callback)
    }
  ],function(err,data){
    if(err)
      utils.l.i("unable to clear events/comments for user",err)
    models.user.deleteUser(user, function(deleteUserErr,deletedUser){
      if(deleteUserErr)
        utils.l.i("Unable to delete user during verification.",deleteUserErr)
      return callback(null,user)
    })
  })
}

function logout(req, res) {
  var user = req.user
  utils.async.waterfall([
    function(callback){
      user.isLoggedIn = false
      models.user.save(user,callback)
    },function(user,callback){
      models.userGroup.updateUserGroup(user._id,[],callback)
    }
  ],function(err,userGroup){
    if(err) {
      utils.l.d("failed to save ths user object: ", err)
    }

    req.logout()
    routeUtils.handleAPISuccess(req, res, {success: true})
  })
}

function getSignupMessage(user){
  var primaryConsole = utils.primaryConsole(user)
  if(primaryConsole.verifyStatus == "INITIATED")
    return "Thanks for signing up for "+utils.config.appName+", the Destiny Fireteam Finder mobile app! An account verification message has been sent to your bungie.net account. Click the link in the message to verify your "+utils._.get(utils.constants.consoleGenericsId, primaryConsole.consoleType)+"."
  else return "Thanks for signing up for "+utils.config.appName+", the Destiny Fireteam Finder mobile app!"
}

function requestResetPassword(req,res){
  var useGamerTag = false
  var userName = req.body.userName
  var consoleType = req.body.consoleType ? req.body.consoleType.toString().toUpperCase() : null
  var consoleId = req.body.consoleId ? req.body.consoleId.toString().trim() : null
  utils.async.waterfall([
      function (callback) {
        utils.l.d("requestResetPassword::userName="+userName+",consoleType="+consoleType+",consoleId="+consoleId)
        if(utils._.isValidNonBlank(consoleType)) {
          useGamerTag = true
          models.user.getUserByData({
            consoles: {
              $elemMatch: {
                consoleType: consoleType,
                consoleId: { $regex : new RegExp(consoleId, "i") }
              }
            }
          }, callback)
        }
        else
          models.user.getUserByData({userName: userName.toLowerCase().trim()}, callback)
      },
      function(user,callback){
        if(user) {
          service.authService.requestResetPassword(user, callback)
        }else {
         if(useGamerTag) callback({error: "Please provide a valid "+ utils._.get(utils.constants.consoleGenericsId, consoleType)})
          else callback({error: "Please provide a valid Crossroads Username."})
        }
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
        consoleId: utils.primaryConsole(user).consoleId,
        userName: user.userName,
        appName:utils.config.appName
      })
    }else{
      res.render("account/error")
    }
  })
}

function resetPassword(req,res){
  var userName = req.body.userName
  var token = req.param("token")
  try {
    req.assert('passWord').notEmpty().isAlphaNumeric()
  } catch(ex) {
    res.render("password must be between 1 and 9 characters and must be alphanumeric")
  }

  var newPassword = passwordHash.generate(req.body.passWord)
  console.log("resetPassword::userName"+userName+",token::"+token)
  utils.async.waterfall([
      function (callback) {
        models.user.getUserByData({passwordResetToken:token},callback)
      },
      function(user,callback){
        if(user) {
          user.passWord = newPassword
          user.verifyStatus ="VERIFIED"

          utils._.map(user.consoles,function(console){
            if(console.verifyStatus != "VERIFIED")
              console.verifyStatus ="VERIFIED"
          })
          models.user.save(user, callback)
        }else callback({error:"Invalid username. Please provide a valid username"})
      }
    ],
    function (err, updatedUser) {
      if (err) {
        req.routeErr = err
        return res.render("Unable to reset password at this time. Please try again later.."+err)
      }
      return res.render("account/resetPasswordConfirm",{appName:utils.config.appName})
    }
  )
}

function home(req,res){
  //res.render('home/index')
  res.writeHead(302, {'Location': 'http://w3.crossroadsapp.co/'})
  res.end()
}

function checkBungieAccount(req, res) {
  utils.l.d("consoleId:: " + req.body.consoleId + ", consoleType:: " + req.body.consoleType)
  utils.l.d("checkBungieAccount", req.body)
  utils.async.waterfall([
    function(callback) {
      models.user.getByQuery({
        consoles: {
          $elemMatch: {
            consoleType: req.body.consoleType,
            consoleId: { $regex : new RegExp(req.body.consoleId, "i") }
          }
        }
      }, utils.firstInArrayCallback(callback))
    },
    function (user, callback) {
      if(utils._.isValidNonBlank(user)) {
        var errMsgTemplate = "The #CONSOLE_GENERICS# #CONSOLE_ID# is already taken"
        var error = {
          error: errMsgTemplate
            .replace("#CONSOLE_GENERICS#", utils._.get(utils.constants.consoleGenericsId, req.body.consoleType))
            .replace("#CONSOLE_ID#", req.body.consoleId)
        }
        return callback(error, null)
      }
      service.userService.checkBungieAccount(req.body, callback)
    }
  ],
    function(err, bungieMember) {
      if (err) {
        routeUtils.handleAPIError(req, res, err, err)
      } else {
        routeUtils.handleAPISuccess(req, res, bungieMember)
      }
    }
  )
}

/** Routes */
routeUtils.rGetPost(router, '/login', 'Login', login, login)
routeUtils.rGetPost(router, '/bo/login', 'BOLogin', boLogin, boLogin)
routeUtils.rPost(router, '/register', 'Signup', signup)
routeUtils.rPost(router, '/logout', 'Logout', logout)
routeUtils.rGet(router, '/verifyconfirm/:token', 'AccountVerification', verifyConfirm)
routeUtils.rGet(router, '/verifyReject/:token', 'verifyReject', verifyReject)
routeUtils.rGet(router, '/verify/:token', 'AccountVerification', verifyAccount)
routeUtils.rGet(router, '/resetPassword/:token', 'resetPasswordLaunch', resetPasswordLaunch, resetPasswordLaunch)
routeUtils.rPost(router, '/request/resetPassword', 'requestResetPassword', requestResetPassword, requestResetPassword)
routeUtils.rPost(router, '/resetPassword/:token', 'resetPassword', resetPassword, resetPassword)
routeUtils.rGet(router,'/','homePage',home,home)
routeUtils.rPost(router, '/checkBungieAccount', 'checkBungieAccount', checkBungieAccount)
module.exports = router

