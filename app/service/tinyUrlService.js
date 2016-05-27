var models = require('../models')
var utils = require('../utils')

function createTinyUrl(longUrl, callback) {
  callback(null, longUrl)
}

function getLongUrl(tinyUrl, callback) {
  callback(null, 'https://live.crossroadsapp.co/terms')
}

module.exports = {
  createTinyUrl: createTinyUrl,
  getLongUrl: getLongUrl
}