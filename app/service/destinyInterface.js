// external libraries
var request = require('request')
var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')
var tinyUrlService = require('./tinyUrlService')

function bungieCookie(){
  models.sysConfig.getSysConfig("bungieCookie",function(err,sysConfig){
    if(!err && sysConfig) {
      utils.l.d("got cookie from sysconfig"+sysConfig.value)
      return sysConfig.value
    }
    else return utils.config.bungieCookie
  })
}

var cookieStr = utils.config.bungieCookie

/*Get bungienet profile
* 1. Make destinySearch call for displayname
* 2. Using the result from search take membershipType and call GetBungieAccount API to bungie membershipcode
* */
function getBungieMemberShip(gamerId, membershipType, callback) {
  utils.async.waterfall([
      function (callback) {
        var destinySearchURL = utils.config.bungieDestinySearchByPSNURL
                                .replace(/%MEMBERSHIPTYPE%/g, getBungieMembershipType(membershipType))
                                .replace(/%MEMBERSHIPID%/g, gamerId);

        bungieGet(destinySearchURL, gamerId,
          utils._.get(utils.constants.consoleGenericsId, membershipType),
          callback)
      },
      function (destinyProfile, callback) {
        var destinyProfileJSON = JSON.parse(destinyProfile)
        if(destinyProfileJSON && destinyProfileJSON.Response) {
          var memberShipType = getBungieMembershipType(membershipType)
          var memberShipId = destinyProfileJSON.Response

          utils.l.d("Got destiny profile memberShipId = " + memberShipId + " && memberShipType=" + memberShipType)
          //var bungieAcctURL ="https://www.bungie.net/Platform/User/GetBungieAccount/"+memberShipId+"/"+memberShipType+"/"
          var bungieAcctURL = utils.config.bungieUserAccountURL+memberShipId + "/" + memberShipType + "/"
          bungieGet(bungieAcctURL, gamerId,
            utils._.get(utils.constants.consoleGenericsId, utils._.get(utils.constants.consoleGenericsId, membershipType)),
            callback)
        } else {
          return callback(null, null)
        }
      },
      function (bungieAcct, callback) {
        var bungieAcctJson =JSON.parse(bungieAcct)

        if(bungieAcctJson && bungieAcctJson.Response) {
          if(utils._.isInvalidOrBlank(bungieAcctJson.Response.bungieNetUser)) {
            return callback(
              {
                error: "Your public Bungie profile is not displaying your linked gaming account. Please set it to public and try again."
              },
              null)
          }
          var bungieAcctResp = bungieAcctJson.Response
          var bungieMemberShipId = bungieAcctResp.bungieNetUser.membershipId
          var displayName = null
          if(utils._.get(utils.constants.bungieMemberShipType, membershipType) == utils.constants.bungieMemberShipType.PSN) {
            displayName = bungieAcctResp.bungieNetUser.psnDisplayName
          }
          else {
            displayName = bungieAcctResp.bungieNetUser.xboxDisplayName
          }
          return callback(null, {bungieMemberShipId: bungieMemberShipId, displayName: displayName})
        } else {
          return callback(
            {
              error: utils.constants.bungieErrorMessage(bungieAcctJson.ErrorStatus)
                      .replace(/%CONSOLETYPE%/g, utils._.get(utils.constants.consoleGenericsId, membershipType))
                      .replace(/%GAMERID%/g, gamerId)
            },
            null)
        }
      }
    ], callback
  )
}

function getBungieHelmet(consoleId,consoleType,callback){
  var memberShipId = null
  var memberShipType = null
    utils.async.waterfall([
      function (callback) {
        var destinySearchURL = utils.config.bungieDestinySearchByPSNURL
          .replace(/%MEMBERSHIPTYPE%/g, getBungieMembershipType(consoleType))
          .replace(/%MEMBERSHIPID%/g, consoleId);

        bungieGet(destinySearchURL, consoleId, utils._.get(utils.constants.consoleGenericsId, consoleType),callback)
      },
      function (destinyProfile, callback) {
        var destinyProfileJSON = JSON.parse(destinyProfile)
        if(destinyProfileJSON && destinyProfileJSON.Response) {
          memberShipType = getBungieMembershipType(consoleType)
          memberShipId = destinyProfileJSON.Response

          utils.l.d("Got destiny profile memberShipId = " + memberShipId + " && memberShipType=" + memberShipType)
          var bungieAcctURL = utils.config.bungieUserAccountURL+memberShipId + "/" + memberShipType + "/"
          bungieGet(bungieAcctURL, consoleId, utils._.get(utils.constants.consoleGenericsId, consoleType),callback)
        } else {
          return callback(null, null)
        }
      },
      function (bungieAcct, callback) {
        var bungieAcctJson =JSON.parse(bungieAcct)
        if(bungieAcctJson && bungieAcctJson.Response) {
          if(utils._.isInvalidOrBlank(bungieAcctJson.Response.destinyAccounts)) {
            return callback({error: "It looks like your Bungie account may be set to private or the server is busy. Please ensure your account is public and try again in a few minutes."},null)
          }
          var bungieCharacters = utils._.map(bungieAcctJson.Response.destinyAccounts,"characters")

          var character = getRecentlyPlayedCharacter(bungieCharacters)
          callback(null, character)
        } else {
          return callback({error: utils.constants.bungieErrorMessage(bungieAcctJson.ErrorStatus)
                .replace(/%CONSOLETYPE%/g, utils._.get(utils.constants.consoleGenericsId, consoleType))
                .replace(/%GAMERID%/g, gamerId)
            },null)
        }
      },function(character, callback){
        //var bungieItemsURL = "https://www.bungie.net/Platform/Destiny/" + memberShipType+"/Account/"+memberShipId+"/Character/"+characterId+"/Inventory/Summary?definitions=true"
        var bungieItemsURL = utils.config.bungieItemsURL
          .replace(/%MEMBERSHIPTYPE%/g, character.membershipType)
          .replace(/%MEMBERSHIPID%/g, character.membershipId)
          .replace(/%CHARACTERID%/g, character.characterId);

        bungieGet(bungieItemsURL, consoleId,utils._.get(utils.constants.consoleGenericsId, consoleType),callback)
      },function(itemDefinitions, callback){
        var itemDefJSON = JSON.parse(itemDefinitions)
        if(itemDefJSON && itemDefJSON.Response && itemDefJSON.Response.definitions && itemDefJSON.Response.definitions.items){
          var helmetURL = getHelmentURL(itemDefJSON.Response.definitions.items)
          utils.l.d("helmetURL::"+helmetURL)
          callback(null,helmetURL)
        }else{
          callback(null,null)
        }
      }
    ], callback
  )
}

/*Get bungienet profile
 * 1. Make destinySearch call for displayname
 * 2. Using the result from search take membershipType and call GetBungieAccount API to bungie membershipcode
 * 3. Send message to bungie user from traveler account
 *
 * TBD - Change the from ID to traveler account instead of Harsha's account :-)
 * */
function sendBungieMessage(bungieMemberShipId, consoleType, messageType,callback){
  utils.async.waterfall([
      function (callback) {
        var convUrl = utils.config.bungieConvURL
        var token = helpers.uuid.getRandomUUID()
        utils.l.d("bungieMemberShipId=", bungieMemberShipId)

        getMessageBody(utils.config.hostUrl(), token, messageType,consoleType,function(err,msgTxt){
          var msgBody = {
            "membersToId": ["13236427", bungieMemberShipId],
            "body": msgTxt
          }
          utils.l.d("msgBody::",msgBody)
          bungiePost(convUrl, msgBody, token,bungieMemberShipId,consoleType, callback)
        })
      }
    ], callback
  )
}

function listBungieGroupsJoined(destinyMembershipId, consoleType, currentPage, callback){
  utils.async.waterfall([
    function(callback) {
      var destinyGruopsJoinedURL = utils.config.destinyGruopsJoinedURL.replace(/%MEMBERSHIPID%/g, destinyMembershipId).replace(/%CURRENTPAGE%/g,currentPage)
      bungieGet(destinyGruopsJoinedURL, null, utils._.get(utils.constants.consoleGenericsId,consoleType), callback)
    },function(bungieGroups, callback) {
      tranformJoinedGroups(bungieGroups, callback)
    }
  ], callback)
}

//url: "https://www.bungie.net/Platform/User/GetBungieAccount/"+memberShipId+"/2/",
//url:"https://www.bungie.net/Platform/Destiny/SearchDestinyPlayer/-1/"+memberShipId+"/",
//url: "https://www.bungie.net/Platform/Destiny/2/Account/"+memberShipId,
//url:"http://www.bungie.net/Platform/User/SearchUsers/?q="+memberShipId,
//url:"https://www.bungie.net/Platform/User/GetBungieNetUser/",
function bungieGet(url, gamerId, consoleType, callback){
  utils.l.d("bungieGet",url)
  request({
    url: url,
    method: "GET",
    headers: {
      //'X-API-KEY': 'f091c8d36c3c4a17b559c21cd489bec0', //harsha //'3beed7e811fb4f78aee0c4595eed1371'
      'X-API-KEY': utils.config.bungieAPIToken
    }
  }, function(error, response, bungieData) {
    if(error) {
      utils.l.s("Error getting bungie for url "+url+" and error is::----"+error)
      return callback(error,null)
    } else {
      utils.l.d('bungie GET for url::'+url)
      if(utils.isJson(bungieData)) {
        var bungieJSON = JSON.parse(bungieData)
        utils.l.d("bungie error status: "+bungieJSON.ErrorStatus)
        if (bungieJSON.ErrorStatus == 'Success')
          return callback(null, bungieData)
        else {
          if (bungieJSON.ErrorStatus != "UserCannotResolveCentralAccount")
            utils.l.s("bungie message GET error", {url: url, bungieData: bungieData, consoleType: consoleType})
          return callback(
            {
              error: utils.constants.bungieErrorMessage(bungieJSON.ErrorStatus)
                      .replace(/%CONSOLETYPE%/g, consoleType)
                      .replace(/%GAMERID%/g, gamerId)
            },
            null)
        }
      } else {
        return callback(
          {
            error: utils.constants.bungieErrorMessage('NotParsableError')
                    .replace(/%CONSOLETYPE%/g, consoleType)
                    .replace(/%GAMERID%/g, gamerId)
          },
          null)
      }
    }
  })
}

function bungiePost(url,msgBody,token,bungieMemberShipId,consoleType,callback){
  request({
    url: url,
    method: "POST",
    headers: {
      'x-api-key': utils.config.bungieAPIToken,
      'x-csrf': utils.config.bungieCSRFToken,
      'cookie': cookieStr
    },
    body:msgBody,
    json:true
  }, function(error, response, bungieData) {
    if(error) {
      utils.l.s("Error posting to bungie::" + error)
      return callback(error, null)
    } else {
      utils.l.d("response::bungieData ", bungieData)
      var bungieJSON = bungieData
      utils.l.d("Got bungie for "+url)
      if(bungieJSON.ErrorStatus == 'Success')
        return callback(null,
          {
            bungieProfile: bungieData,
            token: token,
            bungieMemberShipId: bungieMemberShipId
          }
        )
      else{
        if(bungieJSON.ErrorStatus != "UserCannotResolveCentralAccount")
          utils.l.s("bungie message POST error",
            {
              errorStatus: bungieJSON.ErrorStatus,
              url: url, msgBody: msgBody,
              token: token,
              bungieMemberShipId: bungieMemberShipId,
              consoleType: consoleType
            }
          )
        return callback(
          {
            error: utils.constants.bungieErrorMessage(bungieJSON.ErrorStatus)
                    .replace(/%CONSOLETYPE%/g,consoleType)
          },
          null)
      }
    }
  })
}

function getMessageBody(host,token,messageType,consoleType,callback){
  var msg = null
  switch (messageType) {
    case utils.constants.bungieMessageTypes.accountVerification:
      tinyUrlService.createTinyUrl(host + "/api/v1/auth/verify/" + token, function(err, url) {
        console.log("url from createTinyUrl" + url)
        msg = utils.constants.bungieMessages.accountVerification
                .replace(/%URL%/g, url)
                .replace(/%APPNAME%/g, utils.config.appName)
                .replace(/%CONSOLETYPE%/g, consoleType)
        utils.l.d("verify msg to send::" + msg)
        return callback(null, msg)
      })
      break
    case utils.constants.bungieMessageTypes.passwordReset:
      tinyUrlService.createTinyUrl(host+"/api/v1/auth/resetPassword/"+token,function(err, url) {
        msg = utils.constants.bungieMessages.passwordReset.replace(/%URL%/g, url)
                .replace(/%APPNAME%/g, utils.config.appName)
        utils.l.d("resetPassword msg to send::" + msg)
        return callback(null, msg)
      })
      break
    default:
      break
  }
}

function tranformJoinedGroups(bungieGroups,callback){
  var bungieGroupsJson = JSON.parse(bungieGroups)
  if(bungieGroupsJson && bungieGroupsJson.Response && bungieGroupsJson.Response.resulOts) {
    var groups = utils._.map(bungieGroupsJson.Response.results,function(group){
      return {
        groupId:group.detail.groupId,
        groupName: group.detail.name,
        avatarPath: utils.config.bungieBaseURL+group.detail.avatarPath,
        bungieMemberCount: group.detail.memberCount,
        clanEnabled: isClanEnabled(group.detail.clanCallsign)}
    })
    return callback(null, groups)
  }
  return callback(null, null)
}

function isClanEnabled(clanCallSign) {
  if(utils._.isUndefined(clanCallSign) || utils._.isEmpty(clanCallSign)) {
    return false
  } else {
    return true
  }
}

function getBungieMembershipType(membershipType) {
  utils.l.d("membershipType::" + membershipType, utils._.get(utils.constants.bungieMemberShipType, membershipType))
  return utils._.get(utils.constants.bungieMemberShipType, membershipType)
}

function getRecentlyPlayedCharacter(characters){
  var sortedChars = utils._.sortBy(utils._.flatMap(characters),function(character){
    return utils.moment(character.dateLastPlayed)
  })

  var lastCharacter = utils._.last(sortedChars)
  if(lastCharacter) return {characterId:lastCharacter.characterId,membershipId:lastCharacter.membershipId,membershipType:lastCharacter.membershipType}
  else return null;

}

function getHelmentURL(itemDef){
  var mapVal = utils._.mapValues(itemDef,function(value){
    if(value.itemTypeName == "Helmet")
      return value.icon
  })
  utils.l.d("mapVal:raw::",mapVal)
  mapVal = utils._.compact(utils._.values(mapVal))
  utils.l.d("mapVal:compact",mapVal)
  mapVal = mapVal && mapVal.length > 0?mapVal[0]:null
  utils.l.d("mapVal:final",mapVal)
  return mapVal
}

module.exports = {
  getBungieMemberShip: getBungieMemberShip,
  sendBungieMessage: sendBungieMessage,
  listBungieGroupsJoined: listBungieGroupsJoined,
  getBungieHelmet:getBungieHelmet
}