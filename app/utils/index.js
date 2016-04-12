var lodash = require('./lodash');
var log = require('./log');
var chai = require('chai');
var config = require('config');
var Chance = require("chance");
var chance = new Chance();
var TIME_ELAPSED_30MIN = 30 * 60 * 1000;

function replaceAll(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}


function firstInArrayCallback(callback) {
  return function(err, data) {
    if (err) {
      return callback(err);
    }
    var firstData = null;
    if (!lodash.isInvalid(data) && data.length !== 0) {
      firstData = data[0];
    }
    return callback(null, firstData);
  }
}

function traverse(data) {
  if (lodash.isArray(data)) {
    traverseArray(data);
  } else if ((typeof data === 'object') && (data !== null)) {
    traverseObjectAndReplaceMomentUrl(data);
  }
}

function traverseArray(arr) {
  arr.forEach(function(data) {
    traverse(data);
  });
}

function traverseObjectAndReplaceMomentUrl(data) {
  if(lodash.has(data, "playUrlAWS")) {
    var time = (new Date(data.date)).getTime();
    var currTime = new Date().getTime();
    if(currTime-time > TIME_ELAPSED_30MIN) {
      data.playUrlAWS = replaceAll(config.placeholder_awsClipUrlHostName, config.awsCloudFrontMomentUrl, data.playUrlAWS);
    }
  }else {
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        traverse(data[key]);
      }
    }
  }
}

function replaceMomentUrlWithCoudFront(data) {
  var mData = JSON.parse(JSON.stringify(data));
  traverse(mData);
  return mData;
}

function updateS3Domain(data) {
  if(lodash.isValid(data)) {
    var dataString = replaceMomentUrlWithCoudFront(data);
    dataString = JSON.stringify(dataString);
    dataString = replaceAll(config.placeholder_awsProfileUrlHostName, config.awsProfiUrl, dataString);
    dataString = replaceAll(config.placeholder_awsContentUrlHostName, config.awsContentUrl, dataString);
    dataString = replaceAll(config.placeholder_awsClipUrlHostName, config.awsClipUrlHostName, dataString);
    return JSON.parse(dataString);
  }else {
    return data;
  }
}


module.exports = {
  format: require('./formatUtils'),
  mongo: require('./mongoUtils'),
  chance: chance,
  constants: require('./constants'),
  config: require('config'),
  _: lodash,
  m: require('./moment'),
  async: require('async'),
  expressValidator: require('express-validator'),
  str: require('underscore.string'),
  url: require('url'),
  chai: chai,
  assert: chai.assert,
  expect: chai.expect,
  l: log,
  firstInArrayCallback: firstInArrayCallback,
  updateS3Domain: updateS3Domain,
  moment:require('moment')
};