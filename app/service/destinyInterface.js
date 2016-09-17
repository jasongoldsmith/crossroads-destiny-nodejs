// external libraries
var request = require('request')
var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')
var tinyUrlService = require('./tinyUrlService')
var proxyURL = process.env.QUOTAGUARD_URL || 'http://quotaguard6541:60a2ade59642@proxy.quotaguard.com:9292'

function getBungieVariables(callback) {
  var keys = [
    utils.constants.sysConfigKeys.bungieCookie,
    utils.constants.sysConfigKeys.bungieCsrfToken
  ]
  var bungieVariables = {}
  models.sysConfig.getSysConfigList(keys, function(err, sysConfigList) {
    if(!err && sysConfigList) {
      var bungieCookie = utils._.find(sysConfigList, function(sysConfig) {
        return sysConfig.key.toString() == utils.constants.sysConfigKeys.bungieCookie
      })
      var bungieCsrfToken = utils._.find(sysConfigList, function(sysConfig) {
        return sysConfig.key.toString() == utils.constants.sysConfigKeys.bungieCsrfToken
      })
      utils.l.d("got bungie cookie from sysconfig: ", bungieCookie.value)
      utils.l.d("got bungie csrf token from sysconfig: ", bungieCsrfToken.value)
      bungieVariables.bungieCookie = bungieCookie.value.toString()
      bungieVariables.bungieCsrfToken = bungieCsrfToken.value.toString()
    }
    else {
      bungieVariables.bungieCookie = utils.config.bungieCookie
      bungieVariables.bungieCsrfToken = utils.config.bungieCSRFToken
      if(utils._.isValidNonBlank(utils.config.bungieCookie)) {
        utils.l.d("got cookie from defaults: ", utils.config.bungieCookie)
      } else {
        utils.l.s("unable to get bungie cookie value")
      }

      if(utils._.isValidNonBlank(utils.config.bungieCSRFToken)) {
        utils.l.d("got csrf token from defaults: ", utils.config.bungieCSRFToken)
      } else {
        utils.l.s("unable to get bungie csrf value")
      }
    }
    return callback(bungieVariables)
  })
}

/*Get bungienet profile
 * 1. Make destinySearch call for displayname
 * 2. Using the result from search take membershipType and call GetBungieAccount API to bungie membershipcode
 * */
function getBungieMemberShip(consoleId, consoleType, destinyMembershipId, callback){
  var destinyProfile = null
  var bungieResponse = {}
  utils.async.waterfall([
    function(callback){
      if(utils._.isValidNonBlank(destinyMembershipId))
        callback(null,{memberShipId:destinyMembershipId,memberShipType:getBungieMembershipType(consoleType)})
      else
        getDestinyProfileByConsole(consoleId,consoleType,callback)
    },function(destinyProfileResp,callback){
      destinyProfile = destinyProfileResp
      getBungieAccount(destinyProfile,consoleId,consoleType,callback)
    },function(bungieAcct,callback){
      getAccountDetails(bungieAcct,'all',callback)
    },function(accountDetails,callback){
      bungieResponse.bungieMemberShipId = accountDetails.bungieNetUser.membershipId
      getDestinyAccounts(accountDetails,callback)
    },function(destinyAccounts,callback){
      bungieResponse.destinyProfile = destinyAccounts
      return callback(null, bungieResponse)
    }
  ],callback)
}

function getDestinyProfileByConsole(consoleId,consoleType,callback){
  utils.async.waterfall([
    function(callback){
      var destinySearchURL = utils.config.bungieDestinySearchByPSNURL
        .replace(/%MEMBERSHIPTYPE%/g, getBungieMembershipType(consoleType))
        .replace(/%MEMBERSHIPID%/g, consoleId);

      bungieGet(destinySearchURL, consoleId,
        utils._.get(utils.constants.consoleGenericsId, consoleType),
        callback)
    },function(destinyProfile,callback){
      var destinyProfileJSON = JSON.parse(destinyProfile)
      if(destinyProfileJSON && destinyProfileJSON.Response) {
        var destinyResponse = {memberShipType:getBungieMembershipType(consoleType),memberShipId:destinyProfileJSON.Response}
        utils.l.d("Got destiny profile", destinyResponse)
        return callback(null,destinyResponse)
      }else return callback(null, null)
    }
  ],callback)
}

function getBungieAccount(detinyProfile,consoleId,consoleType,callback){
  utils.async.waterfall([
    function(callback){
      var bungieAcctURL = utils.config.bungieUserAccountURL+detinyProfile.memberShipId + "/" +detinyProfile.memberShipType + "/"
      bungieGet(bungieAcctURL, consoleId, utils._.get(utils.constants.consoleGenericsId, consoleType), callback)
    },function(bungieAcct,callback){
      var bungieAcctJson =JSON.parse(bungieAcct)

      if(bungieAcctJson && bungieAcctJson.Response)
        return callback(null, bungieAcctJson)
      else
        return callback(
          {error: utils.constants.bungieErrorMessage(bungieAcctJson.ErrorStatus)
            .replace(/%CONSOLETYPE%/g, utils._.get(utils.constants.consoleGenericsId, consoleType))
            .replace(/%GAMERID%/g, consoleId)
          },
          null)
    }
  ],callback)
}

function getAccountDetails(bungieAcct,acctType,callback){
  var bungieAcctResponse = {}
  switch (acctType) {
    case "bungieNetUser":
      if(utils._.isInvalidOrBlank(bungieAcct.Response.bungieNetUser))
        return callback({
          error: "Your public Bungie profile is not displaying your linked gaming account. Please set it to public and try again.",
          errorType: "BungieError" }, null)
      else
        bungieAcctResponse.bungieNetUser = bungieAcct.Response.bungieNetUser
      break;
    case "destinyAccounts":
      if(utils._.isInvalidOrBlank(bungieAcct.Response.destinyAccounts))
        return callback({
          error: "It looks like your Bungie account may be set to private or the server is busy. Please ensure your account is public and try again in a few minutes.",
          errorType: "BungieError"}, null)
      else
        bungieAcctResponse.destinyAccounts=bungieAcct.Response.destinyAccounts
      break
    case "all":
      if(utils._.isInvalidOrBlank(bungieAcct.Response.bungieNetUser)){
        return callback({
          error: "Your public Bungie profile is not displaying your linked gaming account. Please set it to public and try again.",
          errorType: "BungieError"}, null)
      }else if(utils._.isValidNonBlank(bungieAcct.Response.destinyAccountErrors) && bungieAcct.Response.destinyAccountErrors.length > 0){
          return callback({
            error: "It looks like this account is on a legacy platform. We’re no longer able to display the information you seek.",
            errorType: "BungieLegacyConsoleError"}, null)
      }else{
        bungieAcctResponse.bungieNetUser = bungieAcct.Response.bungieNetUser
        bungieAcctResponse.destinyAccounts = bungieAcct.Response.destinyAccounts
      }
      break;
    default:
      break
  }
  return callback(null,bungieAcctResponse)
}

function getDestinyAccounts(accountDetail,callback){
/*
  var destinyAccounts = []
  if(!utils._.isInvalidOrBlank(accountDetail.destinyAccounts)) {
    utils._.map(accountDetail.destinyAccounts, function(account){
      var destinyUserInfo = {}
      destinyUserInfo.clanTag= account.userInfo.clanTag
      destinyUserInfo.destinyMembershipId = account.userInfo.memberShipId
      destinyUserInfo.destinyMembershipType = account.userInfo.membershipType
      destinyUserInfo.destinyDisplayName=account.userInfo.displayName

      getBungieHelmetByCharacter(account,function(err,data){
        destinyUserInfo.helmetUrl = data
      })
      destinyAccounts.push(destinyUserInfo)
    })
  }
  return callback(null,destinyAccounts)
*/
  utils.async.mapSeries(accountDetail.destinyAccounts, function(account,asyncCallback) {
    getDestinyDetails(account,asyncCallback)
  },function(err, destinyAccounts) {
    return callback(err, destinyAccounts)
  })
}

function getClanTag(accountDetail,destinyProfile){
  var clanTag = null
  if(!utils._.isInvalidOrBlank(accountDetail.destinyAccounts)) {
    utils._.map(accountDetail.destinyAccounts, function(account){
      utils.l.d('getClanTag::account.userInfo.membershipId',account.userInfo.membershipId)
      if(account.userInfo.membershipId.toString() == destinyProfile.memberShipId.toString())
        clanTag= account.clanTag
    })
  }
  return clanTag
}

function getBungieHelmet(consoleId, consoleType, destinyMembershipId, callback){
  var destinyProfile = null
  var clanTag = null
  utils.async.waterfall([
    function(callback){
      if(utils._.isValidNonBlank(destinyMembershipId))
        callback(null,{memberShipId:destinyMembershipId,memberShipType:getBungieMembershipType(consoleType)})
      else
        getDestinyProfileByConsole(consoleId,consoleType,callback)
    },function(destinyProfileResp,callback){
      destinyProfile = destinyProfileResp
      getBungieAccount(destinyProfile,consoleId,consoleType,callback)
    },function(bungieAcct,callback){
      getAccountDetails(bungieAcct,'destinyAccounts',callback)
    },function(accountDetails,callback){
      clanTag = getClanTag(accountDetails, destinyProfile)
      utils.l.d("clanTag",clanTag)
      var character = getRecentlyPlayedCharacter(accountDetails.destinyAccounts, destinyProfile.memberShipId)
      utils.l.d("recent character",character)
      if(character) callback(null, character)
      else callback({error:"Looks like you do not have any destiny account.", errorType: "BungieError"},null)
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
        callback(null,{helmetURL:helmetURL,clanTag:clanTag,destinyProfile:destinyProfile})
      }else{
        callback(null,null)
      }
    }
  ],callback)
}


function getDestinyDetails(account,callback){
  var destinyUserInfo = {}
  destinyUserInfo.clanTag= account.userInfo.clanTag
  destinyUserInfo.destinyMembershipId = account.userInfo.membershipId
  destinyUserInfo.destinyMembershipType = account.userInfo.membershipType
  destinyUserInfo.destinyDisplayName=account.userInfo.displayName

  utils.async.waterfall([
      function(callback){
        var character =  getRecentlyPlayedCharacterByAccount(account)
        var bungieItemsURL = utils.config.bungieItemsURL
          .replace(/%MEMBERSHIPTYPE%/g, character.membershipType)
          .replace(/%MEMBERSHIPID%/g, character.membershipId)
          .replace(/%CHARACTERID%/g, character.characterId);
        var consoleType = utils._.get(utils.constants.newGenConsoleType,account.userInfo.memberShipType)
        bungieGet(bungieItemsURL, account.userInfo.displayName,utils._.get(utils.constants.consoleGenericsId, consoleType),callback)
      },function(itemDefinitions, callback){
        var itemDefJSON = JSON.parse(itemDefinitions)
        if(itemDefJSON && itemDefJSON.Response && itemDefJSON.Response.definitions && itemDefJSON.Response.definitions.items){
          var helmetURL = getHelmentURL(itemDefJSON.Response.definitions.items)
          utils.l.d("helmetURL::"+helmetURL)
          destinyUserInfo.helmetUrl =helmetURL
          callback(null,destinyUserInfo)
        }else{
          callback(null,destinyUserInfo)
        }
      }],
    callback)
}
function getBungieHelmetByCharacter(destinyAccount,callback){
  utils.async.waterfall([
    function(callback) {
     var character =  getRecentlyPlayedCharacterByAccount(destinyAccount)
      var bungieItemsURL = utils.config.bungieItemsURL
        .replace(/%MEMBERSHIPTYPE%/g, character.membershipType)
        .replace(/%MEMBERSHIPID%/g, character.membershipId)
        .replace(/%CHARACTERID%/g, character.characterId);
      var consoleType = utils._.get(utils.constants.newGenConsoleType,destinyAccount.userInfo.memberShipType)
      bungieGet(bungieItemsURL, destinyAccount.userInfo.displayName,utils._.get(utils.constants.consoleGenericsId, consoleType),callback)
    },function(itemDefinitions, callback){
      var itemDefJSON = JSON.parse(itemDefinitions)
      if(itemDefJSON && itemDefJSON.Response && itemDefJSON.Response.definitions && itemDefJSON.Response.definitions.items){
        var helmetURL = getHelmentURL(itemDefJSON.Response.definitions.items)
        utils.l.d("helmetURL::"+helmetURL)
        callback(null,helmetURL)
      }else{
        callback(null,null)
      }
    }],
    callback)
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
            "membersToId": [utils.config.bungieCrsRdAppId, bungieMemberShipId],
            "body": msgTxt
          }
          utils.l.d("msgBody::",msgBody)
          bungiePost(convUrl, msgBody, token,bungieMemberShipId,consoleType, callback)
        })
      }
    ], callback
  )
}

function sendBungieMessageV2(bungieMemberShipId, consoleType, messageType,callback){
  utils.async.waterfall([
      function (callback) {
        var convUrl = utils.config.bungieConvURL
        var token = helpers.uuid.getRandomUUID()
        utils.l.d("bungieMemberShipId=", bungieMemberShipId)

        getMessageBody(utils.config.hostUrl(), token, messageType,consoleType,function(err,msgTxt){
          var msgBody = {
            "membersToId": [utils.config.bungieCrsRdAppId, bungieMemberShipId],
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
   // proxy: proxyURL,
    headers: {
      //'X-API-KEY': 'f091c8d36c3c4a17b559c21cd489bec0', //harsha //'3beed7e811fb4f78aee0c4595eed1371'
      'X-API-KEY': utils.config.bungieAPIToken,
    //  'User-Agent': 'node.js'
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
                .replace(/%GAMERID%/g, gamerId),
              errorType: "BungieError"
            },
            null)
        }
      } else {
        return callback(
          {
            error: utils.constants.bungieErrorMessage('NotParsableError')
              .replace(/%CONSOLETYPE%/g, consoleType)
              .replace(/%GAMERID%/g, gamerId),
            errorType: "BungieError"
          },
          null)
      }
    }
  })
}

function bungiePost(url, msgBody, token, bungieMemberShipId, consoleType, callback) {
  utils.async.waterfall([
    function (callback) {
      getBungieVariables(function(bungieVariables) {
        return callback(null, bungieVariables)
      })
    },
    function (bungieVariables, callback) {
      request({
        url: url,
        method: "POST",
      //  proxy: proxyURL,
        headers: {
          'x-api-key': utils.config.bungieAPIToken,
          'x-csrf': bungieVariables.bungieCsrfToken,
          'cookie': bungieVariables.bungieCookie,
       //   'User-Agent': 'node.js'
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
                  .replace(/%CONSOLETYPE%/g, consoleType),
                errorType: "BungieError"
              },
              null)
          }
        }
      })
    }
  ], callback)
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
      tinyUrlService.createTinyUrl(host+"/api/v2/auth/resetPassword/"+token,function(err, url) {
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
  if(bungieGroupsJson && bungieGroupsJson.Response && bungieGroupsJson.Response.results) {
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

function getRecentlyPlayedCharacterByAccount(destinyAccount){
  //var characters = utils._.map(bungieAcctJson.Response.destinyAccounts,"characters")
  var characters = destinyAccount.characters
  var sortedChars = utils._.sortBy(utils._.flatMap(characters),function(character){
    return utils.moment(character.dateLastPlayed)
  })

  var lastCharacter = utils._.last(sortedChars)
  if(lastCharacter) return {characterId:lastCharacter.characterId,membershipId:lastCharacter.membershipId,membershipType:lastCharacter.membershipType}
  else return null;

}


function getRecentlyPlayedCharacter(destinyAccounts,memberShipId){
  //var characters = utils._.map(bungieAcctJson.Response.destinyAccounts,"characters")
  var characters = null
  utils._.map(destinyAccounts, function(account){
    utils.l.d('account.userInfo.membershipId',account.userInfo.membershipId)
    if(account.userInfo.membershipId.toString() == memberShipId.toString())
      characters= account.characters
  })


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
  sendBungieMessageV2:sendBungieMessageV2,
  listBungieGroupsJoined: listBungieGroupsJoined,
  getBungieHelmet:getBungieHelmet
}