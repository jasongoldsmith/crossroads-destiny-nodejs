var utils = require('../utils')
var models = require('../models')

function resolveReport(data,callback){

}

function createReport(data, callback) {
    utils.async.waterfall(
        [
            function(callback) {
                models.report.createReport(data, callback)
            },
            function(report, callback) {
                if(utils._.isInvalid(report)) {
                    return callback(null, null)
                }
                callback(null, report)
            }
        ], callback)
}

module.exports = {
    createReport: createReport,
    resolveReport: resolveReport
}