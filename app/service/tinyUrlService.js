var models = require('../models')
var utils = require('../utils')

function createTinyUrl(longUrl, callback) {
	callback(null, null)
}

function getLongUrl(tinyUrl, callback) {
	callback(null, null)
}

module.exports = {
	createTinyUrl: createTinyUrl,
	getLongUrl: getLongUrl
}