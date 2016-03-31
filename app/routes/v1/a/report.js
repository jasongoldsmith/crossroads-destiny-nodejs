var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var service = require('../../../service/index')
var utils = require('../../../utils/index')

function createReport(req, res) {
    utils.l.i("Event create request: " + JSON.stringify(req.body))
    service.reportService.createReport(req.body, function(err, event) {
        if (err) {
            routeUtils.handleAPIError(req, res, err, err)
        } else {
            routeUtils.handleAPISuccess(req, res, event)
        }
    })
}

function resolveReport(req,res){
    service.reportService.resolveReport(req.body, function(err, event) {
        if (err) {
            routeUtils.handleAPIError(req, res, err, err)
        } else {
            routeUtils.handleAPISuccess(req, res, event)
        }
    })
}

routeUtils.rPost(router, '/create', 'createReport', createReport)
routeUtils.rPost(router, '/resolve', 'resolveRepor', resolveReport)
module.exports = router