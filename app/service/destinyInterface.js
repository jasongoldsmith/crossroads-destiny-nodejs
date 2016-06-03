// external libraries
var request = require('request')
var utils = require('../utils')
var helpers = require('../helpers')
var tinyUrlService = require('./tinyUrlService')

var cookieStr=utils.config.bungieCookie

/*Get bungienet profile
* 1. Make destinySearch call for displayname
* 2. Using the result from search take membershipType and call GetBungieAccount API to bungie membershipcode
* */
function getBungieMemberShip(gamerId,membershipType,callback) {
  utils.async.waterfall([
      function (callback) {
        var destinySearchURL = utils.config.bungieDestinySearchByPSNURL.replace(/%MEMBERSHIPTYPE%/g, getBungieMembershipType(membershipType)).replace(/%MEMBERSHIPID%/g, gamerId);
        bungieGet(destinySearchURL,utils._.get(utils.constants.consoleGenericsId, membershipType),callback)
      },
      function (destinyProfile, callback) {
        var destinyProfileJSON = JSON.parse(destinyProfile)
        if(destinyProfileJSON && destinyProfileJSON.Response){
          var memberShipType = getBungieMembershipType(membershipType)
          var memberShipId=  destinyProfileJSON.Response

          utils.l.d("Got destiny profile memberShipId="+memberShipId+" && memberShipType="+memberShipType)
          //var bungieAcctURL ="https://www.bungie.net/Platform/User/GetBungieAccount/"+memberShipId+"/"+memberShipType+"/"
          var bungieAcctURL =utils.config.bungieUserAccountURL+memberShipId+"/"+memberShipType+"/"
          bungieGet(bungieAcctURL,utils._.get(utils.constants.consoleGenericsId, utils._.get(utils.constants.consoleGenericsId, membershipType)),callback)
        }else{
          return callback(null,null)
        }
      },
      function (bungieAcct,callback) {
        var bungieAcctJson =JSON.parse(bungieAcct)

        if(bungieAcctJson && bungieAcctJson.Response && bungieAcctJson.Response.bungieNetUser) {
          var bungieAcctResp = bungieAcctJson.Response
          var bungieMemberShipId = bungieAcctResp.bungieNetUser.membershipId
          var psnDisplayName = bungieAcctResp.bungieNetUser.psnDisplayName

          callback(null,{bungieMemberShipId:bungieMemberShipId,psnDisplayName:psnDisplayName})
        }else{
          callback({error:utils.constants.bungieErrorMessage(bungieAcctJson.ErrorStatus).replace(/%CONSOLETYPE%/g,utils._.get(utils.constants.consoleGenericsId, membershipType))},null)
        }
      }
    ],callback
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
    ],callback
  )
}

function listBungieGroupsJoined(destinyMembershipId, currentPage, callback){
  utils.async.waterfall([
    function(callback){
      var destinyGruopsJoinedURL = utils.config.destinyGruopsJoinedURL.replace(/%MEMBERSHIPID%/g,destinyMembershipId).replace(/%CURRENTPAGE%/g,currentPage)
      bungieGet(destinyGruopsJoinedURL,callback)
    },function(bungieGroups,callback){
      tranformJoinedGroups(bungieGroups,callback)
    }
  ],callback)
}

//url: "https://www.bungie.net/Platform/User/GetBungieAccount/"+memberShipId+"/2/",
//url:"https://www.bungie.net/Platform/Destiny/SearchDestinyPlayer/-1/"+memberShipId+"/",
//url: "https://www.bungie.net/Platform/Destiny/2/Account/"+memberShipId,
//url:"http://www.bungie.net/Platform/User/SearchUsers/?q="+memberShipId,
//url:"https://www.bungie.net/Platform/User/GetBungieNetUser/",
function bungieGet(url, consoleType,callback){
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
      var bungieJSON = JSON.parse(bungieData)
      utils.l.d("Got bungie for "+url)
      if(bungieJSON.ErrorStatus == 'Success')
        return callback(null,bungieData)
      else{
        return callback({error:utils.constants.bungieErrorMessage(bungieJSON.ErrorStatus).replace(/%CONSOLETYPE%/g,consoleType)},null )
      }
    }
  })
}

function bungiePost(url,msgBody,token,bungieMemberShipId,consoleType,callback){
  utils.l.d("bungiePost::msgBody",msgBody)
  request({
    url: url,
    method: "POST",
    headers: {
      'x-api-key': utils.config.bungieAPIToken,
      'x-csrf':utils.config.bungieCSRFToken,
      'cookie':cookieStr
    },
    body:msgBody,
    json:true
  }, function(error, response, bungieData) {
    if(error) {
      utils.l.s("Error posting to bungie::"+error)
      return callback(error, null)
    } else {
      utils.l.d("response html ",bungieData)
      var bungieJSON = bungieData
      utils.l.d("Got bungie for "+url)
      if(bungieJSON.ErrorStatus == 'Success')
        return callback(null,{bungieProfile:bungieData,token:token,bungieMemberShipId:bungieMemberShipId})
      else{
        return callback({error:utils.constants.bungieErrorMessage(bungieJSON.ErrorStatus).replace(/%CONSOLETYPE%/g,consoleType)},null )
      }
    }
  })
}

function getMessageBody(host,token,messageType,consoleType,callback){
  var msg = null
  switch (messageType) {
    case utils.constants.bungieMessageTypes.accountVerification:
      tinyUrlService.createTinyUrl(host+"/api/v1/auth/verify/"+token,function(err, url){
        console.log("url from createTinyUrl"+url)
        msg = utils.constants.bungieMessages.accountVerification.replace(/%URL%/g, url).replace(/%APPNAME%/g,utils.config.appName).replace(/%CONSOLETYPE%/g,consoleType)
        utils.l.d("verify msg to send::"+msg)
        return callback(null,msg)
      })
      break;
    case utils.constants.bungieMessageTypes.passwordReset:
      tinyUrlService.createTinyUrl(host+"/api/v1/auth/resetPassword/"+token,function(err, url) {
        msg = utils.constants.bungieMessages.passwordReset.replace(/%URL%/g, url).replace(/%APPNAME%/g, utils.config.appName)
        utils.l.d("resetPassword msg to send::"+msg)
        return callback(null,msg)
      })
      break;
    default:
      break;
  }
}

function tranformJoinedGroups(bungieGroups,callback){
  var bungieGroupsJson = JSON.parse(bungieGroups)
  if(bungieGroupsJson && bungieGroupsJson.Response && bungieGroupsJson.Response.results){
    var groups = utils._.map(bungieGroupsJson.Response.results,function(group){
      return {groupId:group.detail.groupId,
        groupName:group.detail.name,
        avatarPath:utils.config.bungieBaseURL+group.detail.avatarPath,
        bungieMemberCount:group.detail.memberCount,
        clanEnabled:isClanEnabled(group.detail.clanCallsign)}
    })
    return callback(null,groups)
  }return callback(null, null)
}

function isClanEnabled(clanCallSign){
  if(utils._.isUndefined(clanCallSign) || utils._.isEmpty(clanCallSign)){
    return false
  }else{
    return true
  }
}

function getBungieMembershipType(membershipType){
  utils.l.d("membershipType::"+membershipType,utils._.get(utils.constants.bungieMemberShipType,membershipType))
  return utils._.get(utils.constants.bungieMemberShipType,membershipType)
}

module.exports={
  getBungieMemberShip:getBungieMemberShip,
  sendBungieMessage:sendBungieMessage,
  listBungieGroupsJoined:listBungieGroupsJoined
}