var models = require('../models')
var utils = require('../utils')
var eventService = require('./eventService')
var eventNotificationTriggerService = require('./eventNotificationTriggerService')

function preUserTimeout(notifTrigger,sysConfig){
  utils.l.d("Starting preUserTimeout")
  utils.async.waterfall([
      function (callback) {
        var preuserTimeoutInterval = getPreUserTimeoutInterval(sysConfig) || utils.config.preUserTimeoutInterval
        utils.l.d("time to notify the users timeout",preuserTimeoutInterval)

        var date = utils.moment().utc().add(preuserTimeoutInterval, "minutes")
        models.user.getByQuery({
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
        utils.l.s("Error sending preUserTimeout notification::" + JSON.stringify(err) + "::" + utils.l.userLog(usersNotified))
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
      function (callback) {
        var userTimeoutInterval = sysConfig.value || utils.config.userTimeoutInterval
        var date = utils.moment().utc().add(userTimeoutInterval, "minutes")
        models.user.getByQuery({
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
        utils.l.s("Error sending userTimeout notification::" + JSON.stringify(err) + "::" + JSON.stringify(usersTimedOut))
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
      eventService.clearEventsForPlayer(user._id,callback)
    }
  ],function(err,eventsLeft){
    utils.l.d('timeoutUser::eventsLeft',utils.l.eventLog(eventsLeft))
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

module.exports = {
  userTimeout: userTimeout,
  preUserTimeout:preUserTimeout
}