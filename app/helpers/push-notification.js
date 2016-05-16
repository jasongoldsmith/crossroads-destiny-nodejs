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

function sendSinglePushNotification(data, alert, installation) {
  utils.l.d("sending notification installation::"+installation+"\nalert::"+alert)
  var dataObj = null

  /* We need to do this check as we have a different payload for player messages
  TODO: Refactor this code when push-notification payload is refactored
   */
  if(utils._.isValidNonBlank(data.event)) {
    dataObj = {
      event: stripEventObject(data.event),
      playerMessage: data.playerMessage
    }
  } else {
    dataObj = stripEventObject(data)
  }

  if(utils._.isInvalidOrBlank(installation) || utils._.isInvalidOrBlank(installation.deviceToken)
    || utils._.isInvalidOrBlank(installation.deviceType) ) {
    return
  }
  try {
    PushNotification.prepare("test", alert, installation.unReadNotificationCount, sound, dataObj)
    PushNotification.addTarget(installation.deviceType, installation.deviceToken)
    PushNotification.push()
  }catch(exp){
    utils.l.s("Error sending push notificaiont::sendSinglePushNotification::+"+exp)
  }
}

function sendMultiplePushNotifications(installations, data, alert) {
  utils.async.map(installations, utils._.partial(sendSinglePushNotification, data, alert))
}

function sendMultiplePushNotificationsForUsers(notification, data) {
  models = require('../models')

  utils.l.d("sendMultiplePushNotificationsForUsers::notification::"
    + JSON.stringify({notification:notification.name,message:notification.message}))

  utils.async.map(notification.recipients, models.installation.getInstallationByUser, function(err, installations) {
    sendMultiplePushNotifications(installations, data, notification.message)
  })
}

function stripEventObject(event) {
  if(utils._.isInvalidOrBlank(event)) {
    return null
  }
  var eventObj = event.toObject()
  delete eventObj.__v
  delete eventObj.notifStatus
  delete eventObj.eType.__v
  stripPlayerObject(eventObj.creator)
  utils._.map(eventObj.players, function(player) {
    stripPlayerObject(player)
  })

  utils.l.d("eventObj: ", eventObj)
  return eventObj
}

function stripPlayerObject(player) {
  delete player.date
  delete player.uDate
  delete player.__v
  delete player.psnVerified
}

module.exports = {
  sendSinglePushNotification: sendSinglePushNotification,
  sendMultiplePushNotifications: sendMultiplePushNotifications,
  sendMultiplePushNotificationsForUsers: sendMultiplePushNotificationsForUsers
}
