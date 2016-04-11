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
  if(utils._.isInvalidOrBlank(installation) || utils._.isInvalidOrBlank(installation.deviceToken)
    || utils._.isInvalidOrBlank(installation.deviceType) ) {
    return
  }
  PushNotification.prepare("test", alert, installation.unReadNotificationCount, sound, data)
  PushNotification.addTarget(installation.deviceType, installation.deviceToken)
  PushNotification.push()
}

function sendMultiplePushNotifications(installations, data, alert) {
  utils.async.map(installations, utils._.partial(sendSinglePushNotification, data, alert))
}

function sendPushNotification(event, eventType, user) {
  if(utils._.isValidNonBlank(event.creator)) {
    sendPushNotificationToCreator(event, eventType, user)
  }
  
  if(event.players.length == event.minPlayers && eventType == utils.constants.eventAction.join && event.minPlayers > 1) {
    utils.l.d("sending push notification to creator for minimum players met")
    sendPushNotificationForEventStatus(event, "min")
  }

  if(event.players.length == event.maxPlayers && eventType == utils.constants.eventAction.join) {
    utils.l.d("sending push notification to creator for maximum players met")
    sendPushNotificationForEventStatus(event, "max")

    // removing the creator of the event from the list, as we already have sent a push to creator
    var players = utils._.remove(event.players, {
      _id: event.creator._id
    })

    sendPushNotificationToAllPlayers(event)
  }
}

function sendPushNotificationToCreator(event, eventType, user) {
  models = require('../models')
  models.installation.getInstallationByUser(event.creator, function(err, installation) {
    if(err) return
    if((eventType == utils.constants.eventAction.join && event.players.length > 1)) {
      var joinMessage = getMessage(event.eType, event.players[event.players.length - 1], eventType)
      utils.l.d("sending join push notification to creator")
      sendSinglePushNotification(event, joinMessage, installation)
    } else if((eventType == utils.constants.eventAction.leave) && event.players.length >= event.minPlayers - 1) {
      var leaveMessage = getMessage(event.eType, user, eventType)
      utils.l.d("sending leave push notification to creator")
      sendSinglePushNotification(event, leaveMessage, installation)
    }
  })
}

function sendPushNotificationForEventStatus(event, eventStatus) {
  models = require('../models')
  models.installation.getInstallationByUser(event.creator, function(err, installation) {
    if(err) return
    sendSinglePushNotification(event, getMinOrMaxPlayersJoinedMessage(event, eventStatus), installation)
  })

}

function sendPushNotificationToAllPlayers(event) {
  models = require('../models')
  var messageTemplate = "Your fireteam is ready for eventName. Join on userName"
  var message = messageTemplate
    .replace("userName", event.creator.userName)
    .replace("eventName", getEventName(event.eType))
  utils.async.map(event.players, models.installation.getInstallationByUser, function(err, installations) {
    sendMultiplePushNotifications(installations, event, message)
  })
}

function getMinOrMaxPlayersJoinedMessage(event, eventStatus) {
  var playernames = (utils._.compact(utils._.map(event.players, function(player) {
    return player.userName
  }))).join(", ")

  var eventName = getEventName(event.eType)
  var messageTemplate = ""
  var playersNeeded = event.maxPlayers - event.players.length
  if (eventStatus == "min") {
    messageTemplate = "userName are ready to play eventName. We're still looking for playersNeeded more players"
  } else if(eventStatus == "max") {
    messageTemplate = "Your fireteam is ready for eventName. userName will be joining you soon"
  }

  return messageTemplate
    .replace("userName", playernames)
    .replace("eventName", eventName )
    .replace("playersNeeded", "" + playersNeeded)
}

function getMessage(activity, addedPlayer, eventType) {
  if(utils._.isInvalid(activity) || utils._.isInvalid(addedPlayer)) {
    return ""
  }
  var eventName = getEventName(activity)
  var message = ""
  if(eventType == utils.constants.eventAction.join) {
    message = "userName has joined eventName"
  } else if(eventType == utils.constants.eventAction.leave) {
    message = "userName has left eventName"
  }
  return message.replace("userName", addedPlayer.userName).replace("eventName", eventName)
}

function getEventName(activity) {
  return  (utils._.compact([activity.aSubType, activity.aDifficulty, activity.aCheckpoint])).join(":")
}

module.exports = {
  sendSinglePushNotification: sendSinglePushNotification,
  sendPushNotification: sendPushNotification
}
