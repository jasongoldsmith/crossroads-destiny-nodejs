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
        bungieGet(destinySearchURL,callback)
      },
      function (destinyProfile, callback) {
        var destinyProfileJSON = JSON.parse(destinyProfile)
        if(destinyProfileJSON && destinyProfileJSON.Response){
          var memberShipType = getBungieMembershipType(membershipType)
          var memberShipId=  destinyProfileJSON.Response

          utils.l.d("Got destiny profile memberShipId="+memberShipId+" && memberShipType="+memberShipType)
          //var bungieAcctURL ="https://www.bungie.net/Platform/User/GetBungieAccount/"+memberShipId+"/"+memberShipType+"/"
          var bungieAcctURL =utils.config.bungieUserAccountURL+memberShipId+"/"+memberShipType+"/"
          bungieGet(bungieAcctURL,callback)
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
          var token = helpers.uuid.getRandomUUID()
          //var convUrl = "https://www.bungie.net/Platform/Message/CreateConversation/?lc=en&fmt=true&lcin=true"
          var convUrl = utils.config.bungieConvURL
          utils.l.d("bungieMemberShipId=" + bungieMemberShipId + "---&&--- psnDisplayName=" + psnDisplayName)
          callback(null,{bungieMemberShipId:bungieMemberShipId})
        }else{
          callback(null,null)
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
function sendBungieMessage(gamerId, membershipType, messageType,callback){

  utils.async.waterfall([
      function (callback) {
        var destinySearchURL = utils.config.bungieDestinySearchByPSNURL.replace(/%MEMBERSHIPTYPE%/g, getBungieMembershipType(membershipType)).replace(/%MEMBERSHIPID%/g, gamerId);
        bungieGet(destinySearchURL,callback)
      },
      function (destinyProfile, callback) {
        var destinyProfileJSON = JSON.parse(destinyProfile)
        if(destinyProfileJSON && destinyProfileJSON.Response){
          var memberShipType = getBungieMembershipType(membershipType)
          var memberShipId=  destinyProfileJSON.Response

          utils.l.d("Got destiny profile memberShipId="+memberShipId+" && memberShipType="+memberShipType)
          //var bungieAcctURL ="https://www.bungie.net/Platform/User/GetBungieAccount/"+memberShipId+"/"+memberShipType+"/"
          var bungieAcctURL =utils.config.bungieUserAccountURL+memberShipId+"/"+memberShipType+"/"
          bungieGet(bungieAcctURL,callback)
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
          var token = helpers.uuid.getRandomUUID()
          //var convUrl = "https://www.bungie.net/Platform/Message/CreateConversation/?lc=en&fmt=true&lcin=true"
          var convUrl = utils.config.bungieConvURL
          utils.l.d("bungieMemberShipId=" + bungieMemberShipId + "---&&--- psnDisplayName=" + psnDisplayName)
          //var msgTxt =getMessageBody(utils.config.hostUrl(), gamerId, token, messageType)
          //utils.l.d("msgTxt::",msgTxt)
          getMessageBody(utils.config.hostUrl(), gamerId, token, messageType,function(err,msgTxt){
            var msgBody = {
              "membersToId": ["13236427", bungieMemberShipId],
              "body": msgTxt
            }
            utils.l.d("msgBody::",msgBody)
            bungiePost(convUrl, msgBody, token,bungieMemberShipId, callback)
          })
        }else{
          callback(null,null)
        }
      }
    ],callback
  )
}

function listBungieGroupsJoined(destinyMembershipId, psnId,currentPage, callback){
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
function bungieGet(url, callback){
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
      utils.l.d("Got bungie for "+url)
      return callback(null,bungieData)
    }
  })
}

function bungiePost(url,msgBody,token,bungieMemberShipId,callback){
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
  }, function(error, response, bungieProfile) {
    if(error) {
      utils.l.s("Error posting to bungie::"+error)
      return callback(error, null)
    } else {
      utils.l.d("response html "+JSON.stringify(bungieProfile))
      return callback(null,{bungieProfile:bungieProfile,token:token,bungieMemberShipId:bungieMemberShipId})
    }

  })
}

function getMessageBody(host,displayName,token,messageType,callback){
  var msg = null
  switch (messageType) {
    case utils.constants.bungieMessageTypes.accountVerification:
      tinyUrlService.createTinyUrl(host+"/api/v1/auth/verify/"+token,function(err, url){
        console.log("url from createTinyUrl"+url)
        msg = utils.constants.bungieMessages.accountVerification.replace(/%URL%/g, url).replace(/%APPNAME%/g,utils.config.appName)
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
  return utils.constants.bungieMemberShipType.PSN
}

module.exports={
  getBungieMemberShip:getBungieMemberShip,
  sendBungieMessage:sendBungieMessage,
  listBungieGroupsJoined:listBungieGroupsJoined
}