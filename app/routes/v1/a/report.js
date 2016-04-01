var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var service = require('../../../service/index')
var utils = require('../../../utils/index')

function createReport(req, res) {
    utils.l.i("Event create request: " + JSON.stringify(req.body))
    req.assert('reportDetails', "Report details cannot be empty").notEmpty()
    req.assert('reporter', "Reporter - User of the person reporting cannot be empty").notEmpty()

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

function listReport(req,res){
    service.reportService.listReport(req.param("status"), function(err, event) {
        if (err) {
            routeUtils.handleAPIError(req, res, err, err)
        } else {
            routeUtils.handleAPISuccess(req, res, event)
        }
    })
}

routeUtils.rPost(router, '/create', 'createReport', createReport)
routeUtils.rPost(router, '/resolve', 'resolveReport', resolveReport)
routeUtils.rGet(router, '/list', 'listReport', listReport)
module.exports = router