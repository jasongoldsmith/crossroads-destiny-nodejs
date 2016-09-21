var express = require('express');
var router = express.Router();
var utils = require('../../utils');
var routeUtils = require('../routeUtils');
var models = require('../../models')

function listConfigs(req, res) {
  models.sysConfig.getSysConfig('CONFIG_TOKEN',function(err,sysConfig){
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      if(utils._.isValidNonBlank(sysConfig) && (req.body.token == sysConfig.value.toString())){
        var configs = {}
        configs.mp={key:utils.config.mixpanelKey}
        routeUtils.handleAPISuccess(req, res, configs)
      }else{
        routeUtils.handleAPIUnauthorized(req, res)
      }
    }
  })
}

routeUtils.rPost(router, '/', 'listConfigs', listConfigs);

module.exports = router;