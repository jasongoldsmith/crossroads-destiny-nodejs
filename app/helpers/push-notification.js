#!/usr/bin/env node
var express = require('express')
var PushNotification = require('push-notification')
var utils = require('../utils')
var path = require('path')
var sound = "default"
var config = require('config')
var models = require('../models')

PushNotification.init({
  apn: {
    cert: (process.env.NODE_ENV == 'production' ? path.resolve('./keys/prod/cert.pem'): path.resolve('./keys/cert.pem')),
    key:  (process.env.NODE_ENV == 'production' ? path.resolve('./keys/prod/key.pem'): path.resolve('./keys/key.pem')),
    production: (process.env.NODE_ENV === 'production'),
    gateway: (process.env.NODE_ENV == 'production' ? "gateway.push.apple.com": "gateway.sandbox.push.apple.com")

    //cert: path.resolve('./keys/prod/cert.pem'),
    //key:  path.resolve('./keys/prod/key.pem'),
    //production: true,
    //gateway: "gateway.push.apple.com"
  },
  gcm: {
    apiKey: utils.config.googleAPIKey
  }
})

function sendSinglePushNotification(data, alert, notificationResponse, installation) {
  utils.l.d("sending notification installation::"+installation+"\nalert::"+alert)
  var payload = getPayload(data, notificationResponse)

  if(utils._.isInvalidOrBlank(installation) || utils._.isInvalidOrBlank(installation.deviceToken)
    || utils._.isInvalidOrBlank(installation.deviceType) ) {
    return
  }
  try {
    PushNotification.prepare("test", alert, installation.unReadNotificationCount, sound, payload)
    PushNotification.addTarget(installation.deviceType, installation.deviceToken)
    PushNotification.push()
  }catch(exp){
    utils.l.s("Error sending push notificaiont::sendSinglePushNotification::+"+exp)
  }
}

function sendMultiplePushNotifications(installations, data, alert, notificationResponse) {
  utils.async.map(installations, utils._.partial(sendSinglePushNotification, data, alert, notificationResponse))
}

function sendMultiplePushNotificationsForUsers(notification, data) {
  models = require('../models')

  utils.l.d("sendMultiplePushNotificationsForUsers::notification::"
    + JSON.stringify({notification:notification.name,message:notification.message}))

  utils.async.map(notification.recipients, models.installation.getInstallationByUser, function(err, installations) {
    sendMultiplePushNotifications(installations, data, notification.message, notification)
  })
}

function getPayload(event, notificationResponse) {
  var payload = {
    notificationName: utils._.isValidNonBlank(notificationResponse) ? notificationResponse.name : null,
    eventId: utils._.isValidNonBlank(event) ? event._id : null,
    eventUpdated: utils._.isValidNonBlank(event) ? event.updated : null,
    eventName: utils._.isValidNonBlank(event) ? event.eType.aSubType : null,
    isTrackable: true
  }
  utils.l.d("payload", payload)
  return payload
}

module.exports = {
  sendSinglePushNotification: sendSinglePushNotification,
  sendMultiplePushNotifications: sendMultiplePushNotifications,
  sendMultiplePushNotificationsForUsers: sendMultiplePushNotificationsForUsers
}
