var express = require('express');
var router = express.Router();
var routeUtils = require('./../../routeUtils');
var helpers = require('../../../helpers');
var utils = require('../../../utils');

function getSelfUser(req, res) {
  var feedData = {value: req.user};
  routeUtils.handleAPISuccess(req, res, feedData)
}

routeUtils.rGet(router, '/self', 'GetSelfUser', getSelfUser);

module.exports = router;
