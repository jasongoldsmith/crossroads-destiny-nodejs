var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var models = require('../../../models/index');
var utils = require('../../../utils/index');
var routeUtils = require('./../../routeUtils');
var helpers = require('../../../helpers');


function getInstallation(req, res) {
  utils.async.waterfall(
    [
      function(callback) {
        models.installation.getInstallationByUser(req.user, callback);
      }
    ],
    function(err, installation) {
      if (err) {
        req.routeErr = err;
        return routeUtils.handleAPIError(req, res, err);
      }
      return routeUtils.handleAPISuccess(req, res, installation);
    }
  );
}


function updateInstallation(req, res) {
  req.assert('deviceToken',"not a valid token").notEmpty();
  var reqDeviceType = req.param("platformType")
  var pushDeviceType = null;
  if(reqDeviceType == "ios") {
    pushDeviceType = "apn";
  }else if(reqDeviceType == "android") {
    pushDeviceType = "gcm";
  }
  utils.async.waterfall(
    [
      function(callback) {
        if(utils._.isInvalid(pushDeviceType) || utils._.isInvalid(req.body.deviceToken)) {
          return callback("invalid url or token empty in the request");
        }
        models.installation.updateInstallation(req.user, pushDeviceType, req.body.deviceToken, callback)
      }
    ],
    function(err, installation) {
      if (err) {
        req.routeErr = err;
        return routeUtils.handleAPIError(req, res, err);
      }
      return routeUtils.handleAPISuccess(req, res, installation);
    }
  );
}

routeUtils.rGetPost(router, '/:platformType', 'installation update', getInstallation, updateInstallation);

module.exports = router;