var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')

// Activity Schema
var reportSchema = require('./schema/reportSchema')

// Model initialization
var Report = mongoose.model('Report', reportSchema.schema)


function getByQuery(query, callback) {
	Event
		.find(query)
		.populate("reporter", "-passWord")
		.exec(callback)
}

function getById(id, callback) {
	if (!id) return callback("Invalid id:" + id)
	getByQuery({'_id':id}, utils.firstInArrayCallback(callback))
}

function createReport(report, callback) {
	var reportObj = new Report(report)
	reportObj.save(function (err, data) {
		if (err) {
			return callback(err, null)
		} else {
			return callback(null, data)
		}
	})
}

module.exports = {
	model: Report,
	createReport: createReport,
	getById: getById,
	getByQuery: getByQuery
}