var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')

function trackData(req, callback) {
  var data = req.body
  var user = req.user

  if(!data.trackingData) {
    data.trackingData = {}
  }

  utils.async.waterfall([
      function(callback) {

        switch(data.trackingKey) {
          case "pushNotification":
            trackPushNotification(data, callback)
            break
          case "appInstall":
            utils.l.i("track appInstall request: " + "$os: " + req.headers['$os'] + " zuid: " + req.zuid + " tracking data: "+ JSON.stringify(data.trackingData))
            trackAppInstall(req, data, callback)
            break
          case "appInit":
            trackAppInit(req, data, callback)
            break
          case "appResume":
            trackAppResume(req, data, callback)
            break
          case "signupInit":
            trackSignupInit(req, data, callback)
            break
          case "eventSharing":
            trackEventSharing(req.user, data, callback)
            break
          case "adCardInit":
            trackAdCardInit(req.user, data, callback)
            break
          case "addActivityInit":
            trackAddActivityInit(req.user, data, callback)
            break
          case "currentTabInit":
            trackCurrentTabInit(req.user, data, callback)
            break
          case "upcomingTabInit":
            trackUpcomingTabInit(req.user, data, callback)
            break
          default:
            return callback(null, null)
            break
        }
      }
    ],
    function (err, key) {
      if(err) {
        utils.l.s("There was error in the tracking this request in mixpanel", err)
        return callback(err, null)
      } else {
        try {
          // appInstall is a special case where we just want to track it once and we do it in it's own method
          if(data.trackingKey != "appInstall") {
            helpers.m.trackRequest(key, data.trackingData, req, user)
          }
        } catch (ex) {
          return callback(null, {success: true, trackingKey: data.trackingKey})
        }
        return callback(null, {success: true, trackingKey: data.trackingKey})
      }
    })
}

function trackPushNotification(data, callback) {
  if(utils._.isInvalidOrBlank(data.trackingData.notificationName)) {
    return callback({error: "notification name cannot be null for notification tracking"}, null)
  } else {
    return callback(null, data.trackingData.notificationName)
  }
}

function trackAppInstall(req, data, callback) {
  utils.l.d('trackAppInstall::got app installData',data)
  var userId = data.trackingData.userId
  if(utils._.isValidNonBlank(userId)) {
    req.zuid = userId
    req.session.zuid = userId
  }
  data.trackingData.userId = req.session.zuid

  // expecting trackingData.ads to be in the format "/<source>/<campaign>/<ad>/<creative>?sasda"
  // We have to maintain this order as it is sent by fb and branch as a deep link
  data.trackingData.ads = utils._.trim(data.trackingData.ads, '/')
  var adsValues = data.trackingData.ads.split('/')
  adsValues[3] = utils._.isValidNonBlank(adsValues[3]) ? adsValues[3].split('?')[0] : null
  data.trackingData.source = utils._.isValidNonBlank(adsValues[0]) ? adsValues[0] : null
  data.trackingData.campaign = utils._.isValidNonBlank(adsValues[1]) ? adsValues[1] : null
  data.trackingData.ad = utils._.isValidNonBlank(adsValues[2]) ? adsValues[2] : null
  data.trackingData.creative = adsValues[3]
  delete data.trackingData.ads

  models.temporaryUser.find(req.adata.distinct_id, function (err, temporaryUser) {
    if(err) {
      return callback(err, null)
    } else if (!temporaryUser) {
      helpers.m.trackRequest(data.key, data.trackingData, req, req.user)
      helpers.m.setUser(req, data.trackingData)
      var temporaryUser = {
        mpDistinctId: req.adata.distinct_id,
        source: data.trackingData.source
      }
      models.temporaryUser.create(temporaryUser, callback)
    } else if (temporaryUser) {
      if(temporaryUser.source == "organic" && data.trackingData.source != "organic") {
        temporaryUser.source = data.trackingData.source
        models.temporaryUser.update(temporaryUser, callback)
      } else {
        return callback(null, temporaryUser)
      }
    }
  })
}

function trackAppInit(req, data, callback) {
  data.trackingData.userId = req.session.zuid
  helpers.m.incrementAppInit(req)
  return callback(null, "appInit")
}

function trackAppResume(req, data, callback) {
  data.trackingData.userId = req.session.zuid
  helpers.m.incrementAppInit(req)
  return callback(null, "appResume")
}

function trackSignupInit(req, data, callback) {
  data.trackingData.userId = req.session.zuid
  return callback(null, "signupInit")
}

function trackAdCardInit(user, data, callback) {
  data.trackingData.userId = user._id.toString()
  return callback(null, "adCardInit")
}

function trackAddActivityInit(user, data, callback) {
  data.trackingData.userId = user._id.toString()
  return callback(null, "addActivityInit")
}

function trackCurrentTabInit(user, data, callback) {
  data.trackingData.userId = user._id.toString()
  return callback(null, "currentTabInit")
}

function trackUpcomingTabInit(user, data, callback) {
  data.trackingData.userId = user._id.toString()
  return callback(null, "upcomingTabInit")
}

function trackEventSharing(user, data, callback) {
  utils.async.waterfall([
    function (callback) {
      if(!data.trackingData.eventId) {
        return callback({error: "eventId cannot be null for event sharing"}, null)
      }
      models.event.getById(data.trackingData.eventId, callback)
    },
    function(event, callback) {
      if(!event) {
        return callback({error: "No event with this id exists"}, null)
      }
      data.trackingData = {
        eventId: event._id.toString(),
        userId: user._id.toString(),
        isCurrentEventOwner: user._id.toString() == event.creator._id.toString(),
        playerCount: event.players.length
      }
      return callback(null, "eventSharing")
    }
  ], callback)
}

module.exports = {
  trackData: trackData,
  trackAppInstall:trackAppInstall
}