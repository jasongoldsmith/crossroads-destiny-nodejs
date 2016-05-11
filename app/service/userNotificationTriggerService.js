var utils = require('../utils')
var models = require('../models')
var schedule = require('node-schedule');
var helpers = require('../helpers')

function handleNotificationTriggerById(notifTriggerId, user){
  switch (notifTrigger.triggerName) {
    case utils.constants.userNotificationTrigger.userSignup:
      utils.l.d("handleNotificationTriggerById::userNotificationTrigger==>>"+utils.moment().utc().format())
      return handleUserSignupNotification(notifTriggerId,user)
      break;
    default:
      break;
  }
}

function handleUserSignupNotification(notifTriggerId,user){
  utils.async.waterfall([
    function (callback) {
      models.notificationTrigger.getByQuery({isActive:true, name:'userSignup'}, callback)
    },
    function (notifTrigger, callback) {
      if(notifTrigger){
        utils.async.map(notifTrigger.notifications,utils._.partial(createNotificationAndSend,user))
      }else callback(null,null)
    }
  ],function(err, data){
    return true
  })
}

function createNotificationAndSend(user,notification){
  utils.l.d("createNotificationAndSend::user="+user+"\nnotification::"+JSON.stringify(notification))
  getNotificationDetails(user, notification, function(err,notificationResponse){
    utils.l.d("notification response object", notificationResponse)
    if(err) util.l.s("createNotificationAndSend::Error while creating notificationResponse object"+err)
    helpers.pushNotification.sendMultiplePushNotificationsForUsers(notificationResponse,event)
  })
}

function getNotificationDetails(user, notification,callback){
  var notificationObj = {
    name: notification.name,
    message: formatMessage(notification.messageTemplate),
    recipients: [user]
  }

  return callback(null,notificationObj)
}

module.exports = {
  handleNotificationTriggerById:handleNotificationTriggerById
}