var config = require('config');
var winston = require('winston');
var lodash = require('./lodash');
var chance = require('./formatUtils').chance;

var logger = winston;
logger.level = config.logLevel;
logger.prettyPrint = true;
console.log("System Log level: " + logger.level);

var sentryClient;
  var raven = require('raven');
if (!lodash.isEmpty(process.env.GETSENTRY_URL)) {
  console.log("Initializing Get Sentry");
  sentryClient = new raven.Client(
    process.env.GETSENTRY_URL
    );
  sentryClient.patchGlobal();
}

function log(level, message, object) {
  var logString = message;
  if (lodash.isValid(object)) {
    if (logString) {
      logString = logString + ' : ' + JSON.stringify(object, null, 2)
    } else {
      logString = JSON.stringify(object);
    }
  }
  if (object instanceof Error) {
    logString = logString + " : " + object.message;
  }
  logger.log(level, logString);
}

function info(message, object) {
  log('info', message, object);
}

function error(message, object) {
  log('error', message, object);
}

function severe(message, object) {
  var data = lodash.assign({}, object, {error_uid: chance.guid()})
  log('error', message, data);
  if (!lodash.isEmpty(process.env.GETSENTRY_URL)) { 
    sentryClient.captureMessage(message, {extra: data});
  }
}

function silly(message, object) {
  log('silly', message, object);
}

function debug(message, object) {
  log('debug', message, object);
}

function sentryMessage(message, object, callback) {
  info(message, object);
  if (!lodash.isEmpty(process.env.GETSENTRY_URL)) {  
    sentryClient.captureMessage(message, {extra: object}, callback);
  } else if(callback) {
    callback();
  }
}

function sentryError(err, callback) {
  var stack = new Error().stack;
  if (!lodash.isEmpty(process.env.GETSENTRY_URL)) {  
    sentryClient.captureError(err, { extra: stack }, callback);
  } else if(callback) {
    callback();
  }
}

module.exports = {
  i: info,
  e: error,
  d: debug,
  s: severe,
  silly: silly,
  sentryMessage: sentryMessage,
  sentryError: sentryError
};