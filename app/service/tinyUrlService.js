var models = require('../models')

function createTinyUrl(longUrl, callback) {
	models.tinyUrl.createTinyUrl(longUrl, callback)
}

function getLongUrl(tinyUrl, callback) {
	models.tinyUrl.getLongUrl(tinyUrl, callback)
}

module.exports = {
  createTinyUrl: createTinyUrl,
  getLongUrl: getLongUrl
}