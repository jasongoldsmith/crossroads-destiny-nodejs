var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')
var destinyInerface = require('./destinyInterface')
var userService =  require('./userService')

function handlUpdateHelmet(user, callback) {
  var newHelmetURL = null
  utils.async.waterfall([
    function(callback){
      var primaryConsole = utils.primaryConsole(user)
      destinyInerface.getBungieHelmet(primaryConsole.consoleId,primaryConsole.consoleType,primaryConsole.destinyMembershipId,callback)
    },function(helmet, callback){
      var primaryConsoleIndex = utils.primaryConsoleIndex(user)
      newHelmetURL = helmet.helmetURL
      user.consoles[primaryConsoleIndex].clanTag = helmet.clanTag
      user.consoles[primaryConsoleIndex].imageUrl = utils.config.bungieBaseURL + newHelmetURL
      user.consoles[primaryConsoleIndex].destinyMembershipId = helmet.destinyProfile.memberShipId
      models.user.updateUser({id:user._id,imageUrl:utils.config.bungieBaseURL+newHelmetURL,consoles:user.consoles},false,callback)
    }
  ],function(err, userUpdated){
    if(!err && newHelmetURL)
      return callback(null,
        {
          status:"Success",
          helmetUrl: utils.config.bungieBaseURL + newHelmetURL,
          message: "Successfully updated helmet"
        })
    else {
      models.helmetTracker.createUser(user,err,callback)
      return callback({error: "We were unable to update your helmet. Please try again later."}, null)
    }
  })
}

function refreshHelmentAndConsoles(user,callback){
  var consoleReq = utils.primaryConsole(user)
  utils.async.waterfall([
    function(callback) {
      userService.checkBungieAccount(consoleReq, callback)
    },
    function(bungieResponse, callback) {
      userService.refreshConsoles(user, bungieResponse, consoleReq, callback)
    }
  ], callback)
}

function bulkUpdateHelmet(page, limit) {
  utils.async.waterfall([
    function(callback) {
      models.user.findUsersPaginated({"consoles.verifyStatus" : "VERIFIED"} ,page ,limit, callback)
    },
    function(userList, callback) {
      utils._.map(userList, function(user) {
        handlUpdateHelmet(user, callback)
      })
    }
  ],
    function(err ,data) {
      utils.l.d('Completed processing page::' + page)
  })

/*
  userStream.on('data', function (doc) {
    utils.l.d('################# got user',doc._id)
    handlUpdateHelmet(doc,function(err,data){
      utils.l.d('&&&&& COMPLETED HELMET UPDATE &&&&')
    })
  }).on('error', function (err) {
    utils.l.d('error getting user',err)
  }).on('close', function () {
    utils.l.d('Completed processing data')
    return callback(null,null)
  });
*/
}

function bulkUpdateVerifiedStatusMixPanel(page, limit) {
  utils.async.waterfall([
    function(callback) {
      models.user.findUsersPaginated({}, page, limit, callback)
    },function(userList, callback) {
      utils._.map(userList, function(user) {
        helpers.m.setOrUpdateUserVerifiedStatusFromConsole(user)
        return callback(null, user)
      })
    }
  ],function(err, data) {
    utils.l.d('Completed processing page for bulkUpdateVerifiedStatus::' + page)
  })
}

module.exports = {
  handlUpdateHelmet: handlUpdateHelmet,
  bulkUpdateHelmet:bulkUpdateHelmet,
  refreshHelmentAndConsoles: refreshHelmentAndConsoles,
  bulkUpdateVerifiedStatusMixPanel: bulkUpdateVerifiedStatusMixPanel
}