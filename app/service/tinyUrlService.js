var models = require('../models')
var utils = require('../utils')

function createTinyUrl(longUrl, callback) {
  callback(null, 'http://app.crsrd.co/123')
}

function getLongUrl(tinyUrl, callback) {
  callback(null, 'https://live.crossroadsapp.co/terms')
}

module.exports = {
  createTinyUrl: createTinyUrl,
  getLongUrl: getLongUrl
}