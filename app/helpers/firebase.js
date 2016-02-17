var utils = require('../utils');
var https = require('https');
var request = require("request");

var FIREBASE_ROOTURL = "https://thetestchat.firebaseio.com/";

function noop(value1, value2) {
  // No operations
  // -- console.log('placeholder NOOP. value1='+value1+'  value2='+value2);
}

function performRequest(method, groupOrChannelId, data, callback) {
  var options = {
    url: FIREBASE_ROOTURL+groupOrChannelId+".json",
    json: data
  };
  request.put(options, function (err, response, body) {
    if(err) {
      return callback(err);
    }
    return callback(null, data);
  })
}

function  sendMessageToGroup(groupId, data, callback) {
  performRequest('POST', groupId + "/" + data._id, data, callback);

}


function  sendMessageToChannel(channelId, channel, type, payload, callback) {
  var data = {
    channel: channel,
    type: type,
    payload: payload,
    date: Date()
  };
  performRequest('POST', 'channel:'+channelId, data, callback);  // $TODO$ - remove 'type' here
}

function getGETOptions(groupOrChannelId) {
  var options = {
    url: FIREBASE_ROOTURL+groupOrChannelId+".json",
  };
  return options;
}

function getMessagesByGroupId(groupId, callback) {
  request.get(getGETOptions(groupId), function (err, response, body) {
    if(err) {
      return callback(err);
    }
    if(!utils._.isInvalidOrBlank(body) && body != "null") {
      var jsonBody = JSON.parse(body);
      var values = Object.keys(jsonBody).map(function (key) {
        return jsonBody[key];
      });
      return callback(null, values);
    }
    return callback(null, null);
  })
}



function getMessagesByChannelId(channelId, callback) {
  request.get(getGETOptions(channelId), function (err, response, body) {
    if(err) {
      return callback(err);
    }
    if(!utils._.isInvalidOrBlank(body) && body != "null") {
      var jsonBody = JSON.parse(body);
      var values = Object.keys(jsonBody).map(function (key) {
        return jsonBody[key];
      });
      return callback(null, values);
    }
    return callback(null, null);
  })
}

function updateMessage(groupId, messageId, data, callback) {
  var options = {
    url: FIREBASE_ROOTURL+groupId+"/"+messageId+".json",
    json: data
  };
  request.put(options, function (err, response, body) {
    if(err) {
      return callback(err);
    }
    return callback(null, data);
  })
}

function deleteChatInFirebase(groupId, callback) {
  var options = {
    url: FIREBASE_ROOTURL+groupId+".json",
  };
  request.del(options, function (err, response, body) {
    if(err) {
      return callback(err);
    }
    return callback(null, null);
  })
}




module.exports = {
  sendMessageToGroup: sendMessageToGroup,
  sendMessageToChannel: sendMessageToChannel,
  getMessagesByGroupId: getMessagesByGroupId,
  getMessagesByChannelId: getMessagesByChannelId,
  noop: noop,
  updateMessage: updateMessage,
  deleteChatInFirebase: deleteChatInFirebase
};