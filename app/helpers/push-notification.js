#!/usr/bin/env node

var express = require('express');
var router = express.Router();
var PushNotification = require('push-notification');
var utils = require('../utils');
var path = require('path');
var sound = "default";

PushNotification.init({
  apn: {
    cert: (process.env.NODE_ENV == 'production' ? path.resolve('./keys/prod/cert.pem'): path.resolve('./keys/cert.pem')),
    key:  (process.env.NODE_ENV == 'production' ? path.resolve('./keys/prod/key.pem'): path.resolve('./keys/key.pem')),
    production: (process.env.NODE_ENV === 'production'),
    gateway: (process.env.NODE_ENV == 'production' ? "gateway.push.apple.com": "gateway.sandbox.push.apple.com")
  },
  gcm: {
    apiKey: utils.config.googleAPIKey
  }
});

function sendSinglePushNotification(data, alert, installation) {
  if(utils._.isInvalidOrBlank(installation) || utils._.isInvalidOrBlank(installation.deviceToken)
    || utils._.isInvalidOrBlank(installation.deviceType) ) {
    return;
  }
  PushNotification.prepare("test", alert, installation.unReadNotificationCount, sound, data);
  PushNotification.addTarget(installation.deviceType, installation.deviceToken);
  PushNotification.push();
}

function sendMultiplePushNotifications(installations, data, alert) {
  utils.async.map(installations, utils._.partial(sendSinglePushNotification, data, alert));
}



module.exports = {
    sendSinglePushNotification: sendSinglePushNotification,
    sendMultiplePushNotifications: sendMultiplePushNotifications
}
