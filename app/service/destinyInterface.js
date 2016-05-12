// external libraries
var request = require('request')
var utils = require('../utils')
var helpers = require('../helpers')

var cookieStr=utils.config.bungieCookie

/*Get bungienet profile
* 1. Make destinySearch call for displayname
* 2. Using the result from search take membershipType and call GetBungieAccount API to bungie membershipcode
* */
function getBungieMemberShipJson(memberShipId) {
  utils.async.waterfall([
      function (callback) {
        var destinySearchURL ="https://www.bungie.net/Platform/Destiny/SearchDestinyPlayer/-1/"+memberShipId+"/"
        bungieGet(destinySearchURL,callback)
      },
      function (destinyProfile, callback) {
        var respArr = JSON.parse(destinyProfile).Response
        if(respArr[0]){
          utils.l.d("Got response "+JSON.stringify(respArr[0]))
          var memberShipType = respArr[0].membershipType
          var memberShipId=  respArr[0].membershipId

          utils.l.d("Got destiny profile memberShipId="+memberShipId+" && memberShipType="+memberShipType)
          var bungieAcctURL ="https://www.bungie.net/Platform/User/GetBungieAccount/"+memberShipId+"/"+memberShipType+"/"
          bungieGet(bungieAcctURL,callback)
        }else{
          return callback(null,null)
        }
      }
    ],
    function (err, bungieAcct) {
      if (err || !bungieAcct) {
        utils.l.s("Unable to get bungie account due to error"+err)
        return "Unable to get bungie account due to error"+err
      } else {
        var bungieAcctResp =JSON.parse(bungieAcct).Response
        var bungieMemberShipId = bungieAcctResp.bungieNetUser.membershipId
        var psnDisplayName = bungieAcctResp.bungieNetUser.psnDisplayName
        utils.l.d("bungieMemberShipId="+bungieMemberShipId+"---&&--- psnDisplayName="+psnDisplayName)
        return "done"
      }
    }
  )
}

/*Get bungienet profile
 * 1. Make destinySearch call for displayname
 * 2. Using the result from search take membershipType and call GetBungieAccount API to bungie membershipcode
 * 3. Send message to bungie user from traveler account
 *
 * TBD - Change the from ID to traveler account instead of Harsha's account :-)
 * */
function sendBungieMessage(gamerId, username, membershipType, callback){

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
          var msgBody = {
            "membersToId": ["13236427", bungieMemberShipId],
            "body": getMessageBody(utils.config.hostUrl(), gamerId, token, username)
          }
          bungiePost(convUrl, msgBody, token,bungieMemberShipId, callback)
        }else{
          callback(null,null)
        }
      }
    ],callback
  )
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
      utils.l.d("Got bungie for "+url+" and bungieData::----"+bungieData)
      return callback(null,bungieData)
    }
  })
}

function bungiePost(url,msgBody,token,bungieMemberShipId,callback){
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

function getMessageBody(host,displayName,token,username){
  var msg= utils.config.accountVerification.replace(/%HOST%/g, host).replace(/%TOKEN%/g, token)
  return msg
}

function getBungieMembershipType(membershipType){
  return utils.constants.bungieMemberShipType.PSN
}

module.exports={
  getBungieMemberShipJson:getBungieMemberShipJson,
  sendBungieMessage:sendBungieMessage
}