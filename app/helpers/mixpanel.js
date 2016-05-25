var Mixpanel = require('mixpanel');
var utils = require('../utils');
var mixpanelKey = utils.config.mixpanelKey;
utils.l.i("Mixpanel key", mixpanelKey);
var mixpanel = null;

if (utils._.isValidNonBlank(mixpanelKey)) {
  mixpanel = Mixpanel.init(mixpanelKey);
}
var reqHelper = require('./reqHelper');

function trackRequest(key, data, req, user) {
  if (utils.config.devMode || !mixpanel) {
    return;
  }
  if (utils._.isInvalid(key)) {
    return;
  }
  var trackData = data || {};
  if (utils._.isValid(req)) {
    trackData.pv_requested_url = req.requested_url;
    // TODO - add query params, forms params etc here
    if (utils._.isValid(req.adata)) {
      utils._.assign(trackData, req.adata);
    }
  }

  // Do not track if utm_dnt is present
  if (utils._.isValid(trackData['utm_dnt'])) {
    return
  }

  if (utils._.isInvalid(user)) {
    user = req.user;
  }
  
  // Set user data
  var userProps = getUserProperties(user);
  utils._.assign(trackData, userProps);

  trackData.time = utils.m.moment().unix().toString();

  trackData.UserFirstVisitDate = utils.mongo.toObjectID(trackData.distinct_id).getTimestamp();
  if (utils._.isInvalidOrBlank(trackData.user_id)) {
    trackData.user_id = trackData.distinct_id;
  }

  //utils.l.i('Mixpanel track', {key: key, data: trackData});
  mixpanel.track(key, trackData, function (err, res) {
    if (err) {
      utils.l.s('Mixpanel error', err);
      return;
    }
  });
}

function getFlagData(user) {
  if (!user.flags || user.flags.length === 0) {
    return null;
  }
  var flagData = utils._.transform(user.flags, function (result, value, key) {
    result['flag_'+key] = value;
  });
  return flagData;
}

function getUserProperties(user) {
  if (utils._.isInvalid(user)) {
    return {
      user_type: 'anonymous'
    };
  }
  var flagData = getFlagData(user);

  var data = {
    user_type: 'user',
    '$name': user.name,
    '$email': user.email,
    '$created': user.date,
    'user_id': user.id
  };
  return utils._.assign(data, flagData);
}

function userToMixpanelPeopleProps(user) {
  if (!user) {
    return {};
  }

  var mixPanelData = {};
  function addKV(key, value) {
    if (utils._.isValidNonBlank(key) && utils._.isValidNonBlank(value)) {
      mixPanelData[key] = value;
    }
  }
  addKV('user_id', user.id);
  addKV('$name', user.name);
  addKV('user_id', user.id);
  addKV('$email', user.email);
  addKV('$created', user.date);
  addKV('password_set', utils._.isValidNonBlank(user.hashed_password));
  utils._.assign(mixPanelData, user.conversionData);

  var flagsData = getFlagData(user);
  utils._.assign(mixPanelData, flagsData);

  return mixPanelData;
}

function setPeopleProps(user) {
  if (utils.config.devMode || !mixpanel) {
    return;
  }
  var mixpanelPeopleProps = userToMixpanelPeopleProps(user);
  mixpanel.people.set(user.id, mixpanelPeopleProps);
}

function setUser(user) {
  mixpanel.people.set(user.userName, {
    events_created: 0,
    events_joined: 0,
    events_left: 0,
    date_joined: user.uDate
  })
}

function trackEvent(event) {
  mixpanel.track(event.eType.aType + ", " + event.eType.aSubType, event)
  incrementEventsCreated(event.creator)
  incrementEventsJoined(event.creator)
}

function incrementEventsCreated(user) {
  mixpanel.people.increment(user.userName, "events_created")
}

function incrementEventsJoined(user) {
  mixpanel.people.increment(user.userName, "events_joined")
}

function incrementEventsLeft(userId) {
  var models = require('../models')
  utils.async.waterfall([
    function (callback) {
      models.user.getById(userId, callback)
    },
    function(user, callback) {
      mixpanel.people.increment(user.userName, "events_left")
      callback(null, user)
    }
  ], function(err, user) {
    if (err) {
      utils.l.d("error in mixpanel while leaving event for user", user)
    }
  })

}

module.exports = {
  trackRequest: trackRequest,
  setPeopleProps: setPeopleProps,
  setUser: setUser,
  trackEvent: trackEvent,
  incrementEventsJoined: incrementEventsJoined,
  incrementEventsLeft: incrementEventsLeft
};