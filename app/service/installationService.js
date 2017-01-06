var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')

function updateInstallation(pushDeviceType, deviceToken, user, callback){
  utils.async.waterfall([
    function(callback) {
      if(utils._.isInvalid(pushDeviceType) || utils._.isInvalid(deviceToken)) {
        return callback("invalid url or token empty in the request")
      }
      models.installation.updateInstallation(user, pushDeviceType, deviceToken, callback)
    },
    function(installation, callback) {
      helpers.sns.registerDeviceToken(user, installation, function (err, result) {
        if(err) {
          utils.l.s("Error is resgistering the device token in SNS", err)
        } else {
          utils.l.d("Device token updated in SNS", installation)
        }
        //Till we sync up with front-end about how they handle error of this API, we call SNS in the background
        return callback(null, installation)
      })
    }]
    ,callback
  )
}

module.exports = {
  updateInstallation: updateInstallation
}