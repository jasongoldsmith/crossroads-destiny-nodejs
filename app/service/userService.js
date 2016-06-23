var models = require('../models')
var utils = require('../utils')
var eventService = require('./eventService')
var eventNotificationTriggerService = require('./eventNotificationTriggerService')

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
      eventService.clearEventsForPlayer(user._id,utils.constants.eventLaunchStatusList.now, callback)
    }
  ],function(err,eventsLeft){
    utils.l.d('timeoutUser::'+utils.l.userLog(user)+"\n\teventsLeft::\n\t",utils.l.eventLog(eventsLeft))
    if(!err){
      if(eventsLeft && eventsLeft.length > 0) utils.async.map(notifTrigger.notifications, utils._.partial(eventNotificationTriggerService.sendMultipleNotifications,eventsLeft,[user]))
      return callback(null,user)
    }else return callback({error:"Error timeout of user::"+user._id},null)
  })
}

module.exports = {
  userTimeout: userTimeout
}