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
    event.players.push(event.creator)
  }
}

//TODO: Refactor this and sendPushNotification method to have common implementation
function sendPushNotificationForScheduler(event) {
  utils.l.d("sendPushNotificationForScheduler::sending push notification for event : " + event)
  if((event.players.length >= event.minPlayers && event.players.length < event.maxPlayers) && event.players.length > 1) {
    utils.l.d("sendPushNotificationForScheduler::sending push notification to creator for minimum players met")
    sendPushNotificationForEventStatus(event, "min")
  }

  if(event.players.length == event.maxPlayers) {
    utils.l.d("sendPushNotificationForScheduler::sending push notification to creator for maximum players met")
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
  var messageTemplate = "Your fireteam is ready for eventName. Join on psnId"
  var message = messageTemplate
    .replace("psnId", event.creator.psnId)
    .replace("eventName", getEventName(event.eType))
  utils.async.map(event.players, models.installation.getInstallationByUser, function(err, installations) {
    sendMultiplePushNotifications(installations, event, message)
  })
}

function getMinOrMaxPlayersJoinedMessage(event, eventStatus) {
  var playernames = (utils._.compact(utils._.map(event.players, function(player) {
    return player.psnId
  }))).join(", ")

  var eventName = getEventName(event.eType)
  var messageTemplate = ""
  var playersNeeded = event.maxPlayers - event.players.length
  if (eventStatus == "min") {
    messageTemplate = "psnId are ready to play eventName. We're still looking for playersNeeded more"
  } else if(eventStatus == "max") {
    messageTemplate = "Your fireteam is ready for eventName. psnId will be joining you soon"
  }

  return messageTemplate
    .replace("psnId", playernames)
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
    message = "psnId has joined eventName"
  } else if(eventType == utils.constants.eventAction.leave) {
    message = "psnId has left eventName"
  }
  return message.replace("psnId", addedPlayer.psnId).replace("eventName", eventName)
}

function getEventName(activity) {
  return  (utils._.compact([activity.aSubType, activity.aDifficulty, activity.aCheckpoint])).join(":")
}

module.exports = {
  sendSinglePushNotification: sendSinglePushNotification,
  sendPushNotification: sendPushNotification,
  sendPushNotificationForScheduler: sendPushNotificationForScheduler
}
