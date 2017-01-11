var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')
var userService = require('./userService')

function updateInstallation(pushDeviceType, deviceToken, user, callback){
  var installationObj = null
  utils.async.waterfall([
    function(callback) {
      if(utils._.isInvalid(pushDeviceType) || utils._.isInvalid(deviceToken)) {
        return callback("invalid url or token empty in the request")
      }
      models.installation.updateInstallation(user, pushDeviceType, deviceToken, callback)
    },function(installation, callback) {
      installationObj = installation
      helpers.sns.registerDeviceToken(user, installation, callback)
    },function(installation, callback){
        userService.subscribeUserNotifications(user,false,callback)
    }]
    ,function(err,result){
      if(utils._.isValidNonBlank(installationObj))
        return callback(null,installationObj)
      else
        return callback(err,null)
    }
  )
}

module.exports = {
  updateInstallation: updateInstallation
}