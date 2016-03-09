#!/usr/bin/env node

var express = require('express');
var router = express.Router();
var PushNotification = require('push-notification');
var utils = require('../utils');
var path = require('path');
var sound = "default";

PushNotification.init({
  apn: {
    cert: path.resolve('./keys/cert.pem'),
    key: path.resolve('./keys/key.pem')
  },
  gcm: {
    apiKey: utils.config.googleAPIKey
  }
});

utils.l.i("the push notification params =", PushNotification.options);
//var iosToken = '69937c97ef2386040ea75d8de961a0855b37dc61682b8c5598631781e28eac0f';
//var androidToken = "dGnjZK7qshg:APA91bF-1GOMkrGYAWJIHhWCN7qTnNQuvI8fY7DCdfAWoHbOdocDv9AUfee0jNljnNM1FY4sB99ag2qfEhNwu8cm1mzTaRiNl3ikbCtoQLbPZm5Huu11wrKS3LIh3b88dySAerEo1Jb2";


function sendSinglePushNotification(data, alert, installation) {
  if(utils._.isInvalidOrBlank(installation)) {
    return;
  }
  PushNotification.prepare("test", alert, installation.unReadNotificationCount, sound, data);
  utils.l.i("the push notification =",installation.deviceType );
  utils.l.i("the push notification =",installation.deviceToken );
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
