var models = require('../models')
var utils = require('../utils')
var eventService = require('./eventService')
var eventNotificationTriggerService = require('./eventNotificationTriggerService')
var destinyInterface = require('./destinyInterface')
var passwordHash = require('password-hash')

function preUserTimeout(notifTrigger,sysConfig){
  utils.l.d("Starting preUserTimeout")
  utils.async.waterfall([
      function (callback){
        models.event.getAllCurrentEventPlayers(callback)
      },
      function (playerIds,callback) {
        var preuserTimeoutInterval = getPreUserTimeoutInterval(sysConfig) || utils.config.preUserTimeoutInterval
        utils.l.d("time to notify the users timeout",preuserTimeoutInterval)

        var date = utils.moment().utc().add(preuserTimeoutInterval, "minutes")
        models.user.getByQuery({
            "_id":{"$in":playerIds},
            "consoles.verifyStatus": "VERIFIED",
            lastActiveTime: {$lte: date},
            notifStatus:{$ne:'preUserTimeout'}
          },
          callback)
      },
      function(userList, callback) {
        utils.l.d("got users for preUserTimeout",utils.l.userLog(userList))
        var totalUsres = userList ? userList.length: 0
        if(totalUsres > 0 && (notifTrigger.isActive && notifTrigger.notifications.length > 0)) {
          //Used to handle concurrent deletes on the same object.
          utils.async.mapSeries(userList, function(user,asyncCallback) {
            notifyPreUserTimeout(user,notifTrigger,asyncCallback)
          },function(err, updatedUsers) {
            return callback(err, updatedUsers)
          })
        }else {
          return callback(null, null)
        }
      }
    ],
    function (err, usersNotified) {
      if (err)
        utils.l.s("Error sending preUserTimeout notification::" + JSON.stringify(err))
      else utils.l.d("preUserTimeout::users notified",utils.l.userLog(usersNotified))
      utils.l.i("Completed trigger preUserTimeout::" +utils.moment().utc().format())
    })
}

function notifyPreUserTimeout(user,notifTrigger,callback){
  utils.async.waterfall([
    function(callback){
      //remove user from all events
      //TODO: Change clearEventsForPlayer to send one push notificaiton or remove the notification part
      //TODO: Clarify if we should not notify the creator
      models.event.getEventsByQuery({
        launchStatus: utils.constants.eventLaunchStatusList.now,
        "players": user._id},callback)
    },function(eventsToLeave,callback){
      utils.l.d('notifyPreUserTimeout::'+utils.l.userLog(user)+"\n\eventsToLeave::\n\t",utils.l.eventLog(eventsToLeave))
      if(eventsToLeave && eventsToLeave.length > 0) {
        utils.async.map(notifTrigger.notifications, utils._.partial(eventNotificationTriggerService.sendMultipleEventNotifications, eventsToLeave, [user]))
        callback(null, user)
      }else return callback(null, null)
    },function (user,callback){
      if(user && !hasNotifStatus(user.notifStatus,"preUserTimeout")) {
        user.notifStatus.push("preUserTimeout")
        utils.l.d('notifyPreUserTimeout::updating notifStatus::preUserTimeout on user',utils.l.userLog(user))
        models.user.save(user,callback)
      }else return callback(null,null)
    }
  ],function(err,user){
    if(!err) {
      utils.l.d('notifyPreUserTimeout::======Completing=========::',utils.l.userLog(user))
      return callback(null, user)
    }
    else return callback({error:"Error notifyPreUserTimeout of user::"+utils.l.userLog(user)},null)
  })
}

function userTimeout(notifTrigger,sysConfig) {
  utils.l.d("Starting userTimeout")
  utils.async.waterfall([
      function (callback){
        models.event.getAllCurrentEventPlayers(callback)
      },
      function (playerIds,callback) {
        var userTimeoutInterval = sysConfig.value || utils.config.userTimeoutInterval
        var date = utils.moment().utc().add(userTimeoutInterval, "minutes")
        models.user.getByQuery({
            "_id":{"$in":playerIds},
            "consoles.verifyStatus": "VERIFIED",
            lastActiveTime: {$lte: date}
          },
          callback)
      },
      function(userList, callback) {
        utils.l.d("got users for timeout",utils.l.userLog(userList))
        var totalUsres = userList ? userList.length: 0
        if(totalUsres > 0 && (notifTrigger.isActive && notifTrigger.notifications.length > 0)) {
          //Used to handle concurrent deletes on the same object.
          utils.async.mapSeries(userList, function(user,asyncCallback) {
            timeoutUser(user,notifTrigger,asyncCallback)
          },function(err, updatedUsers) {
            return callback(err, updatedUsers)
          })
        }else {
          return callback(null, null)
        }
      }
    ],
    function (err, usersTimedOut) {
      if (err) {
        utils.l.s("Error sending userTimeout notification::" + JSON.stringify(err))
      }
      utils.l.i("Completed trigger userTimeout::" +utils.moment().utc().format())
    }
  )
}

function timeoutUser(user,notifTrigger,callback){
  utils.async.waterfall([
    function(callback){
      //remove user from all events
      //TODO: Change clearEventsForPlayer to send one push notificaiton or remove the notification part
      //TODO: Clarify if we should not notify the creator
      eventService.clearEventsForPlayer(user, utils.constants.eventLaunchStatusList.now, null, callback)
    }
  ],function(err,eventsLeft){
    utils.l.d('timeoutUser::'+utils.l.userLog(user)+"\n\teventsLeft::\n\t",utils.l.eventLog(eventsLeft))
    if(!err){
      if(eventsLeft && eventsLeft.length > 0) utils.async.map(notifTrigger.notifications, utils._.partial(eventNotificationTriggerService.sendMultipleEventNotifications,eventsLeft,[user]))
      return callback(null,user)
    }else return callback({error:"Error timeout of user::"+user._id},null)
  })
}

function getPreUserTimeoutInterval(sysconfigs){
  var userTimeoutConfig = utils._.find(sysconfigs,{key:utils.constants.sysConfigKeys.userTimeoutInMins})
  var preUserTimeoutConfig = utils._.find(sysconfigs,{key:utils.constants.sysConfigKeys.preUserTimeoutInMins})
  utils.l.d('getPreUserTimeoutInterval:userTimeoutConfig::'+userTimeoutConfig+"::preUserTimeoutConfig::"+preUserTimeoutConfig)
  return (userTimeoutConfig.value - preUserTimeoutConfig.value)
}

function hasNotifStatus(notifStatusList, notifStatus){
  //console.log("notifStatusList["+JSON.stringify(notifStatusList)+"],notifStatus:"+JSON.stringify(notifStatus)+"="+utils._.indexOf(JSON.parse(JSON.stringify(notifStatusList)),notifStatus))
  if(utils._.indexOf(notifStatusList,notifStatus) >= 0) return true
  else return false
}

function upgradeConsole(user, oldConsoleType, newConsoleType, callback) {
  var consoleObject = utils.getUserConsoleObject(user, oldConsoleType)
  utils.async.waterfall([
    function (callback) {
      if (utils._.isInvalidOrBlank(consoleObject)) {
        var errMsg = "#CONSOLE_TYPE# not found for user"
        return callback ({error: errMsg.replace("#CONSOLE_TYPE#", oldConsoleType)}, null)
      } else {
        eventService.clearEventsForPlayer(user, null, oldConsoleType, callback)
      }
    },
    function (events, callback) {
      consoleObject.consoleType = newConsoleType
      updateUser(user, function (err, updatedUser) {
        if(err) {
          utils.l.s("Unable to update the user", err)
          return callback({error: "Something went wrong. Please try again"}, null)
        } else {
          return callback(null, updatedUser)
        }
      })
    }
  ], callback)
}

function addConsole(user, console, callback) {
  var consoleType = console.consoleType.toString().toUpperCase()
  if(consoleType == "XBOX360" || consoleType == "PS3") {
    return callback({error: "We do not support old generation consoles anymore. " +
    "Please try again once you have upgraded to a new generation console"}, null)
  }
  utils.async.waterfall([
    function (callback) {
      destinyInterface.getBungieMemberShip(console.consoleId, consoleType, null, callback)
    },
    function (bungieMember, callback) {
      if(bungieMember.bungieMemberShipId.toString() != user.bungieMemberShipId.toString()) {
        var errMsgTemplate = utils.constants.bungieMessages.addConsoleErrorMsg
        var errMsg = errMsgTemplate
          .replace("#CONSOLE_TYPE#", consoleType)
          .replace("#CONSOLE_ID#", console.consoleId)
        return callback({error: errMsg}, null)
      } else {
        console.verifyStatus = user.consoles[0].verifyStatus
        console.clanTag = bungieMember.clanTag
        console.destinyMembershipId = bungieMember.destinyProfile.memberShipId
        user.consoles.push(console)
        updateUser(user, function (err, updatedUser) {
          if(err) {
            utils.l.s("Unable to update the user", err)
            return callback({error: "Something went wrong. Please try again"}, null)
          } else {
            return callback(null, updatedUser)
          }
        })
      }
    }
  ], callback)

}

function refreshConsoles(user, bungieResponse, consoleReq, callback){
  utils.async.waterfall([
    function(callback){
      if (utils._.isValidNonBlank(bungieResponse) && utils._.isValidNonBlank(bungieResponse.destinyProfile)) {
        utils.async.mapSeries(bungieResponse.destinyProfile, function (destinyAccount, asyncCallback) {
            mergeConsoles(user, destinyAccount, asyncCallback)
          },
          function (err, consoles) {
            return callback(null, consoles)
          }
        )
      }
    },function(consoles, callback){
      //user.consoles = consoles
      setPrimaryConsoleAndHelmet(user,consoleReq)
      utils.l.d('refreshConsoles::user',user)
      models.user.save(user, callback)
    }
  ],callback)

}

function setPrimaryConsoleAndHelmet(user,consoleReq){
  utils._.map(user.consoles,function(consoleObj){
    if(consoleReq.consoleType == consoleObj.consoleType){
      user.imageUrl = consoleObj.imageUrl
      consoleObj.isPrimary = true
    }else
      consoleObj.isPrimary = false
  })
}

function mergeConsoles(user, destinyAccount, callback){
  var consoles = user.consoles
  var primaryConsole = utils.primaryConsole(user)
  utils.l.d('mergeConsoles::',destinyAccount)
  var consoleObj = {}
  consoleObj.consoleType = utils._.get(utils.constants.newGenConsoleType, destinyAccount.destinyMembershipType)
  consoleObj.destinyMembershipId = destinyAccount.destinyMembershipId
  consoleObj.consoleId = destinyAccount.destinyDisplayName
  consoleObj.clanTag = destinyAccount.clanTag
  consoleObj.imageUrl = utils.config.bungieBaseURL + "/" + destinyAccount.helmetUrl
  consoleObj.verifyStatus = primaryConsole ? primaryConsole.verifyStatus : "INITIATED"

  if (consoleObj.consoleType == 'PS4')
    mergeConsoleByType(consoleObj,'PS3',user,callback)
  else if (consoleObj.consoleType == 'XBOXONE')
    mergeConsoleByType(consoleObj,'XBOX360',user,callback)
}

function mergeConsoleByType(newConsole,legacyConsoleType,user,callback){
  var oldConsoleObject = utils.getUserConsoleObject(user, legacyConsoleType)
  if (utils._.isValidNonBlank(oldConsoleObject)) {
    utils.l.d("mergeConsoles::user on legacy consoles"+legacyConsoleType)
    //upgrade user console, destiny account from bungie is updated to new gen. Our system has old gen console
    updateConsole(user,oldConsoleObject,newConsole.consoleType,newConsole.consoleId,callback)
  } else if (utils._.isInvalidOrBlank(utils.getUserConsoleObject(user, newConsole.consoleType))) {
    //add console, destiny account from bungie is not our system.
    utils.l.d("mergeConsoles::Adding new console"+newConsole.consoleType)
    consoles.push(newConsole)
    return callback(null, newConsole)
  }else {
    //Override consoleId with what bungie has
    var newGenExistingConsole = utils.getUserConsoleObject(user, newConsole.consoleType)
    newGenExistingConsole.consoleId = newConsole.consoleId
    return callback(null, newGenExistingConsole)
  }
}

function updateConsole(user, oldConsole, newConsoleType,newConsoleId,callback){
  utils.async.waterfall([
    function(callback) {
      eventService.clearEventsForPlayer(user, null, oldConsole.consoleType, callback)
    }
  ],function(err,data){
    if(!err) {
      oldConsole.consoleType = newConsoleType
      oldConsole.consoleId = newConsoleId
    }
    return callback(null,oldConsole)
  })
}
function changePrimaryConsole(user, consoleType, callback) {
  var consoleObject = utils.getUserConsoleObject(user, consoleType)
  if(utils._.isInvalidOrBlank(consoleObject)) {
    var errMsg = "#CONSOLE_TYPE# not found for user"
    return callback ({error: errMsg.replace("#CONSOLE_TYPE#", consoleType)}, null)
  }

  var oldPrimaryConsoles = utils._.filter(user.consoles, 'isPrimary')
  utils._.forEach(oldPrimaryConsoles, function (console) {
    console.isPrimary = false
  })
  consoleObject.isPrimary = true
  updateUser(user, callback)
}

function updateUser(user, callback) {
  models.user.save(user, callback)
}

function checkBungieAccount(console, callback) {
  destinyInterface.getBungieMemberShip(console.consoleId, console.consoleType, console.destinyMembershipId, function(err, bungieResponse) {
    if (err) {
      return callback(err, null)
    }else if(!bungieResponse || !bungieResponse.bungieMemberShipId || utils._.isEmpty(bungieResponse.bungieMemberShipId)){
      var error = {
        error: utils.constants.bungieMessages.bungieMembershipLookupError
          .replace("#CONSOLE_TYPE#", utils._.get(utils.constants.consoleGenericsId, console.consoleType))
          .replace("#CONSOLE_ID#", console.consoleId),
        errorType: "BungieError"
      }
      return callback(error, null)
    } else {
      var bungieMember = {
        consoleId: console.consoleId,
        consoleType: console.consoleType,
        bungieMemberShipId: bungieResponse.bungieMemberShipId,
        destinyProfile: bungieResponse.destinyProfile
      }
      return callback(null, bungieMember)
    }
  })
}


function setLegalAttributes(user){
  var userWithLegalResp = JSON.parse(JSON.stringify(user))
  userWithLegalResp.legal.termsNeedsUpdate = false
  userWithLegalResp.legal.privacyNeedsUpdate = false

  return userWithLegalResp
}

function getNewUserData(password,clanId,mpDistinctId,refreshedMixPanel,bungieResponse,consoleType){
  var userData = {
    passWord: password?passwordHash.generate(password):password,
    clanId: clanId,
    mpDistinctId: mpDistinctId,
    mpDistinctIdRefreshed:refreshedMixPanel
  }

  if(utils._.isValidNonBlank(bungieResponse)){
    var consolesList =  []
    utils._.map(bungieResponse.destinyProfile,function(destinyAccount){
      var consoleObj = {}
      consoleObj.consoleType =  utils._.get(utils.constants.newGenConsoleType, destinyAccount.destinyMembershipType)
      consoleObj.destinyMembershipId = destinyAccount.destinyMembershipId
      consoleObj.consoleId=destinyAccount.destinyDisplayName
      consoleObj.clanTag=destinyAccount.clanTag
      consoleObj.imageUrl = utils.config.bungieBaseURL + "/" +destinyAccount.helmetUrl
      if(consoleObj.consoleType == consoleType)
        consoleObj.isPrimary = true
      else
        consoleObj.isPrimary = false
      consolesList.push(consoleObj)
    })
    userData.consoles = consolesList
    userData.bungieMemberShipId =  bungieResponse.bungieMemberShipId
  }
  return userData
}

module.exports = {
  userTimeout: userTimeout,
  preUserTimeout: preUserTimeout,
  upgradeConsole: upgradeConsole,
  addConsole: addConsole,
  changePrimaryConsole: changePrimaryConsole,
  checkBungieAccount: checkBungieAccount,
  setLegalAttributes:setLegalAttributes,
  refreshConsoles:refreshConsoles,
  setPrimaryConsoleAndHelmet:setPrimaryConsoleAndHelmet,
  getNewUserData:getNewUserData
}