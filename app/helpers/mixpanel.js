var Mixpanel = require('mixpanel')
var utils = require('../utils')
var mixpanelKey = utils.config.mixpanelKey
utils.l.i("Mixpanel key", mixpanelKey)
var mixpanel = null

if (utils._.isValidNonBlank(mixpanelKey)) {
  mixpanel = Mixpanel.init(mixpanelKey)
}
var reqHelper = require('./reqHelper')

function trackRequest(key, data, req, user) {
/*  if (utils.config.devMode || !mixpanel) {
    return
  }*/
  var userMpId = utils._.isValid(user) ? user.mpDistinctId:null
  utils.l.d('trackRequest::mixpanelId::'+reqHelper.getHeader(req,'x-mixpanelid')+'::key::'+key+"::mpDistinctId::"+userMpId)
  if(utils._.isInvalidOrBlank(reqHelper.getHeader(req,'x-mixpanelid')) && utils._.isInvalidOrBlank(userMpId)){
      return
  }

  if (utils._.isInvalid(key)) {
    return
  }
  var trackData = data || {}
  setReqAdata(req, trackData)

  // Do not track if utm_dnt is present
  if (utils._.isValid(trackData['utm_dnt'])) {
    return
  }

  if (utils._.isInvalid(user)) {
    user = req.user
  }
  
  // Set user data
  var userProps = getUserProperties(user)
  utils._.assign(trackData, userProps)

  trackData.time = utils.m.moment().unix().toString()

  if (utils._.isInvalidOrBlank(trackData.user_id)) {
    trackData.user_id = trackData.distinct_id
  }

  utils.l.d('Mixpanel track', {key: key, data: trackData})
  mixpanel.track(key, trackData, function (err, res) {
    if (err) {
      utils.l.s('Mixpanel error', err)
      return
    }
  })
}

function getUserProperties(user) {
  if (utils._.isInvalid(user)) {
    return {
      user_type: 'anonymous'
    }
  }

  var data = {
    user_type: 'user',
    '$username': user.userName,
    '$created': user.date,
    'user_id': user._id,
    'events_created': user.stats.eventsCreated,
    'events_joined': user.stats.eventsJoined,
    'events_left': user.stats.eventsLeft,
    'events_full': user.stats.eventsFull,
  }

  return data
}

function setUser(req, data,callback) {
  utils.l.d('mixpanelId::'+reqHelper.getHeader(req,'x-mixpanelid'))
  if(utils._.isInvalidOrBlank(reqHelper.getHeader(req,'x-mixpanelid'))){
    return
  }
  utils.l.d('2222:mixpanelId::'+reqHelper.getHeader(req,'x-mixpanelid'))
  var trackingData = data || {}
  setReqAdata(req, trackingData)
  mixpanel.people.set(req.zuid,
    {
      events_created: 0,
      events_joined: 0,
      events_left: 0,
      events_full: 0,
      app_init: 0,
      app_resume: 0,
      source: trackingData.source,
      campaign: trackingData.campaign,
      ad: trackingData.ad,
      creative: trackingData.creative,
    })
  setOnce(req)
  mixpanel.alias(req.zuid,trackingData.distinct_id,callback)
}

function setOnce(req) {
  mixpanel.people.set_once(req.zuid,
    {
      userFirstSeen: new Date().toISOString()
    })
}

function setUserAlias(req,data,callback){
  utils.l.d("setUserAlias::zuid"+req.zuid+"::req.adata",req.adata)
  var trackingData = data || {}
  mixpanel.people.set(req.zuid,
    {
      source: trackingData.source,
      campaign: trackingData.campaign,
      ad: trackingData.ad,
      creative: trackingData.creative,
    })
  setReqAdata(req, trackingData)
  setOnce(req)
  mixpanel.alias(req.zuid,trackingData.distinct_id,callback)
}

function updateUserJoinDate(req, user) {
  mixpanel.people.set_once(req.zuid, {
    date_joined: user.date
  })
}

function updateUserSource(req, trackingData) {
  mixpanel.people.set(req.zuid,
    {
      source: trackingData.source,
      campaign: trackingData.campaign,
      ad: trackingData.ad,
      creative: trackingData.creative,
    })
}

function trackEvent(event) {
  if(utils._.isInvalidOrBlank(event.creator.mpDistinctId)){
    return
  }

  mixpanel.track(event.eType.aType + ", " + event.eType.aSubType, event)
  incrementEventsCreated(event.creator)
  incrementEventsJoined(event.creator)
}

function incrementEventsCreated(user) {
  if(utils._.isInvalidOrBlank(user.mpDistinctId)){
    return
  }

  mixpanel.people.increment(user._id, "events_created")
}

function incrementEventsJoined(user) {
  if(utils._.isInvalidOrBlank(user.mpDistinctId)){
    return
  }

  mixpanel.people.increment(user._id, "events_joined")
}

function incrementEventsFull(user) {
  if(utils._.isInvalidOrBlank(user.mpDistinctId)){
    return
  }

  mixpanel.people.increment(user._id, "events_full")
}

function incrementAppInit(req) {
  mixpanel.people.increment(req.zuid, "app_init")
}

function incrementAppResume(req) {
  mixpanel.people.increment(req.zuid, "app_resume")
}

function incrementEventsLeft(user) {
  if(utils._.isInvalidOrBlank(user.mpDistinctId)){
    return
  }

  mixpanel.people.increment(user._id.toString(), "events_left")
}

function setReqAdata(req, trackData) {
  if (utils._.isValid(req)) {
    trackData.pv_requested_url = req.requested_url
    if (utils._.isValid(req.adata)) {
      utils._.assign(trackData, req.adata)
    }
  }
}

module.exports = {
  trackRequest: trackRequest,
  setUser: setUser,
  setUserAlias:setUserAlias,
  updateUserJoinDate: updateUserJoinDate,
  updateUserSource: updateUserSource,
  trackEvent: trackEvent,
  incrementEventsCreated: incrementEventsCreated,
  incrementEventsJoined: incrementEventsJoined,
  incrementEventsFull: incrementEventsFull,
  incrementEventsLeft: incrementEventsLeft,
  incrementAppInit: incrementAppInit,
  incrementAppResume: incrementAppResume
}