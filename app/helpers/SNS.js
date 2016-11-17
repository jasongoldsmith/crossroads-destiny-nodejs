var AWS = require('aws-sdk');
var utils = require('../utils')

AWS.config.update(utils.config.awsSNSKey)
var sns = new AWS.SNS()

function unRegisterDeviceToken(user, callback) {

}

function registerDeviceToken(user,installation,callback){
  var models = require('../models')
  //get deviceToken from installation
  //Register devicetoken with SNS for app_%DEVICE_TYPE%_%ENV%_%GROUP%_%CONSOLETYPE%
  //Store endpointurl for device in user as deviceEndPoints:[{app_%DEVICE_TYPE%_%ENV%_%GROUP%_%CONSOLETYPE%:endpoint}]
  // e.g. {app_apn_dev_clan_id_not_set_PS4:endpoint from aws}
  var config = {}
  var installationObj = null
  utils.async.waterfall([
    function(callback){
      if(utils._.isValidNonBlank(installation))
        return callback(null,installation)
      else
        models.installation.getInstallationByUser(user,callback)
    },
    function(installation, callback) {
      config.deviceToken = installation.deviceToken
      config.deviceType = installation.deviceType
      config.groupId = user.clanId
      installationObj = installation
      var console = utils.primaryConsole(user)
      config.consoleType = console.consoleType
      getApplicationArn(installation.deviceType, callback)
    },
    function(sysconfigARN, callback) {
      config.appARN = sysconfigARN.value
      getTopicARN(config.consoleType, config.groupId, callback)
    },
    function(sysconfigTopic, callback) {
      config.topicARN = sysconfigTopic.value
      sns.createPlatformEndpoint({
        PlatformApplicationArn: config.appARN,
        Token: config.deviceToken,
        Attributes: {Enabled: 'true'}
      }, callback)
    },
    function(deviceEndPoint, callback) {
      config.endPointArn = deviceEndPoint.EndpointArn
      sns.subscribe({
        Protocol: 'application',
        TopicArn: config.topicARN,
        Endpoint: deviceEndPoint.EndpointArn
      }, callback)
    },
    function(subscribeEndPoint, callback) {
      var subEndpointObj = {key: getTopicARNKey(config.consoleType, config.groupId),
        subscriptionArn: subscribeEndPoint.SubscriptionArn, endPointArn: config.endPointArn}
      installationObj.deviceSubscriptions.push(subEndpointObj)
      models.installation.findByIdAndUpdate(installationObj._id,
        {deviceSubscriptions: installationObj.deviceSubscriptions}, callback)
    }
  ], callback)
}

function getDeviceEndpoints(userList, callback) {
  //get user specific device endpoint for sending messages to specific userlist
}

function unsubscribeAllEndpoints(user, isUserLoggedIn, callback) {
  utils.async.waterfall([
    function(callback) {
      models.installation.getInstallationByUser(user, callback)
    },
    function(installation, callback) {
      utils.async.mapSeries(user.groups, function(userGroup, asyncCallback) {
        //if this method is called from the mute notification flow, unsubsribe for only the groups which have mute turned on
        if(isUserLoggedIn && userGroup.muteNotification)
          utils._.map(user.consoles, function (userConsole) {
            unsubscribeEndpoint(user, userGroup.groupId, userConsole.consoleType, installation, asyncCallback)
          })
        else if(!isUserLoggedIn)
          utils._.map(user.consoles,function(userConsole) {
            unsubscribeEndpoint(user, userGroup.groupId, userConsole.consoleType, installation, asyncCallback)
          })
        else asyncCallback(null, null)
      },
        function(err, data) {
        if(err) {
          utils.l.d('Error:Unsubscribing all user endpoints', err)
          return callback({error: "There was a problem in muting notifications"}, null)
        } else {
          utils.l.d('Completed unsubscription of endpoints for user', data)
          return callback(null, {success: true})
        }
      })
    }
  ], callback)
}

function unsubscribeEndpoint(user, groupId, consoleType, installation, callback) {
  utils.async.waterfall([
    function(callback) {
/*
      getTopicARN(config.consoleType,config.groupId,function(err,sysconfigTopic){
        if(!err) {
          var topicARN = sysconfigTopic.value
          var subscriptionArn = getSubscriptionArn(user,groupId,consoleType,installation)
          sns.unsubscribe({SubscriptionArn:subscriptionArn},callback)
        }else return callback({error:"unable to lookup topic subscription details."},null)
      })
*/
      var deviceSubscription = getSubscriptionArn(user, groupId, consoleType, installation)
      var subscriptionArn = deviceSubscription.subscriptionArn.toString()
      //Unsubscribe from AWS
      if(utils._.isValidNonBlank(deviceSubscription))
        sns.unsubscribe({SubscriptionArn: subscriptionArn}, function(err, data) {
          //regardless of err or successful update with AWS, remove the subscription in local DB.
        })

      //Remove subscription ARN in installation object for this topic
      deviceSubscription.subscriptionArn = null
      models.installation.findByIdAndUpdate(installation._id,
        {deviceSubscriptions: installation.deviceSubscriptions}, callback)
    }
  ], callback)
}

function getSubscriptionArn(user, groupId, consoleType, installation) {
  var deviceSubscription = utils._.filter(installation.deviceSubscriptions,
    {key: getTopicARNKey(consoleType, groupId)})
  return deviceSubscription
}

function getApplicationArn(deviceType, callback) {
  var models = require('../models')
  var appARNKey =  utils.constants.sysConfigKeys.awsSNSAppArn
    .replace(/%DEVICE_TYPE%/g, deviceType)
    .replace(/%ENV%/g, utils.config.environment)
  utils.l.d('appARNKey::', appARNKey)
  models.sysConfig.getSysConfig(appARNKey, callback)
}

function getTopicARN(consoleType, groupId, callback) {
  var models = require('../models')
  var topicARN = getTopicARNKey(consoleType,groupId)
  utils.l.d('topicARN::', topicARN)
  models.sysConfig.getSysConfig(topicARN, callback)
}

function getTopicARNKey(consoleType,groupId){
  var topicARNKey = utils.constants.sysConfigKeys.awsSNSTopicArn
    .replace(/%CONSOLETYPE%/g, consoleType)
    .replace(/%GROUP%/g, groupId)
    .replace(/%ENV%/g, utils.config.environment)
  return topicARNKey
}

function publishToSNSTopic(consoleType, groupId, customPayload, callback) {
  var topicARN = null
  utils.async.waterfall([
    function(callback) {
      getTopicARN(consoleType, groupId, callback)
    },
    function(topicARN, callback) {
      var payload = {}
      payload.default = 'Hello World'


      var apsData = {
        aps: {
          alert: 'Custom Hello World for event from Harsha',
          sound: 'default',
          badge: 1
        }
      }

      payload.APNS = apsData
      payload.APNS.payload = customPayload
      payload.APNS_SANDBOX = apsData
      payload.APNS_SANDBOX.payload = customPayload

      /*
      if(utils.config.environment == 'production' || utils.config.environment == 'staging')
        payload.APNS = apsData
      else
        payload.APNS_SANDBOX = apsData
      */
      payload.GCM = {
          "data": {
            "message": "Custom Hello World for event from Harsha",
            "payload": customPayload
            }
          }


      utils.l.d('publishToSNSTopic::topicARN', topicARN)
      utils.l.d('payloadJson', payload)
      // first have to stringify the inner APNS object...
      payload.APNS = JSON.stringify(payload.APNS);
      payload.APNS_SANDBOX = JSON.stringify(payload.APNS_SANDBOX)
      payload.GCM = JSON.stringify(payload.GCM)
      // then have to stringify the entire message payload
      //payload.payload = JSON.stringify(payload.payload);
     payload = JSON.stringify(payload)

      utils.l.d('payload', payload)
      utils.l.d()
      var params = {
        Message: payload,
        MessageStructure: 'json',
        TopicArn: topicARN.value
      };

      sns.publish(params, callback)
    }
  ],
    function(err, data) {
      if (err) {
        console.log(err.stack)
        return
      }
      console.log('push sent')
      console.log(data)
    })
}

function sendPush() {
  console.log('inside sendPush')
  sns.createPlatformEndpoint({
    PlatformApplicationArn: 'arn:aws:sns:us-west-2:412817206882:app/APNS_SANDBOX/app_apn_dev_clan_id_not_set_PS4',
    Token: '001d20bec1ff5b47faea5957cd487cca34df68fa34a478dea9dc97bbcddfa375',
    Attributes: {
      Enabled:'true'
    }
  },
    function (err, data) {
      if (err) {
        console.log(err.stack)
        return
    }
      var endpointArn = data.EndpointArn
      var payload = {
        default: 'Hello World',
        APNS: {
          aps: {
            alert: 'Hello World',
            sound: 'default',
            badge: 1
          }
        }
      }

    // first have to stringify the inner APNS object...
    // payload.APNS = JSON.stringify(payload.APNS);
    // then have to stringify the entire message payload
    payload = JSON.stringify(payload)

    console.log('sending push')
    sns.publish({
      Message: payload,
      MessageStructure: 'json',
      TargetArn: endpointArn
    },
      function (err, data) {
        if (err) {
          console.log(err.stack)
          return
        }
        console.log('push sent')
        console.log(data)
      })
    })
}

module.exports = {
  sendPush: sendPush,
  registerDeviceToken: registerDeviceToken,
  publishToSNSTopic: publishToSNSTopic,
  unsubscribeAllEndpoints: unsubscribeAllEndpoints
}