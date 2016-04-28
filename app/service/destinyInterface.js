// external libraries
var request = require('request')
var utils = require('../utils')
var helpers = require('../helpers')
var BungiePlatform = require('bungie-platform');
//var uuid = require('uuid')
//harsha //var cookieStr="__cfduid=d7fe261f69963d40917feac11cad26a761459446069; bungled=4410636698596642863; bungledid=B8wEl0Lj8t9MrnvjhpYjqbg3B+uli1nTCAAA; bungles=WebView=False&mt=2&mi=4611686018459149267&ci=2305843009376124114; _gat=1; sto-id-sg_www.bungie.net=JIAKHPAK; bungleRedir=L2VuLVVTL1VzZXIvQVBJ; bungleatk=wa=IA5p1jW3oWevWTX5fUAC33U7s7z01qN86zfWeb1I0eXgAAAAbShTzfBsis8ZKgw6rbdqeOAcBgadNwzKEmRq0VPp7dnlkbOwScnC2WLpMaPZjx3jpfTxDaeP3IoTc9SgayOg0LwkzAlEjngHCcuCjdNIDzTsI8GzhqUkWE5qj9swqF24ZiNdsy0a-i6FSMMScdOVQFhEYgp-0IowidZvmL1Ac4.DlhpMwU0p3du0QZHHYgn1N3LqKXU85JC4PG6wMVYkbuj.89WBLjrc.0Zk1PlmZJOzqU1.AjM6YsjrqzWNUGP6KuzeOWg2MopphqpT.IRmn2C92-Ul8OZD40aEL4-NJns_&tk=YAAAAOk.TpdY-uq2ki7j2NseHl-ZIjC6iOZRfgjxxKK1bexrgXdYtkPoSEuAyQXMEQClJwwWfQCBNr5sqBUtAXiVRPGd1tOfQCuxK339gZS20-F7hFmxaXMbkWLrP6ZFwjsjjCAAAADiWkxIA-IunMqSiTbc33eL6u0sMeA0vn171AzNMz.USA__; bungleme=13172709; bungleloc=lc=en&lcin=false; _ga=GA1.2.883620681.1459446075; bunglefrogblastventcore=1461789721"
//var cookieStr="__cfduid=d7fe261f69963d40917feac11cad26a761459446069; bungled=4410636698596642863; bungledid=B8wEl0Lj8t9MrnvjhpYjqbg3B+uli1nTCAAA; sto-id-sg_www.bungie.net=OIAKHPAK; bungleRedir=Lw==; bungles=WebView=False; bunglesony=rJHEYOs.Mfs7L6LQlTgtf6fEmGkrZOQNB1PUJcHtBE.AAAAAMn4.TRnDWhCB0D64k.5V.RTrLXHfztRBd8GBhw7eVGfzHI.iD9gOTIcUzXD327XyWL8pq-QHmwPS1uLWYiPin143sMiB4-ele0niu9RoJnhjyQ8oYq7y7sJq4Myon2kd2AHXM1vxu6lOYt3Me3lG1GlYHb1pW0H16ThRFkNHfFo_; bungleatk=wa=qrN3GZ4S2lBJli3THd7-PQwRYLBXAHRnM-uzqXIuFrXgAAAAqmwrhDxn70o3KT3KTS61ChEGuju.L2cgr0CzEKKQ2v.inDKIKCaPN58BdKcHdt8r8EjhTWCrI6x2VCfG.YPRFZ7ej8hHGG5GuXN3Yhjvazp5HrASXRXvUZsHnsiBxoly6GJq-EB6Rzlb-ctUYivtWTxSZvLdl0Awi0PsK1qtTlTIOEWCiMmBAEIlkKkigsF021z5cLIJ4V.j95r9J1IUrfHPsDTNZRxyMPQKcErBlwQFE1YgT9njXntIlL9SklAhy742M-Zj2JVxOn6.o0jYKroNpXoHqO1Nv96a.tzb8gk_&tk=YAAAAEsYTcHXWLv6bec3ugZohzElNBHwqNa8SoGK0OloWMtRr3wxCcn3zVLlABoQMc5RZY6JpGNSv1ssQHXx7rAz9bko0.UmnK4uKVqtPUzIvww3FmCrV4x5NvKh1GiQMJm0iiAAAAAbX8e3jZFt.AVH.usPj0AFolPVexVnzQbaYmW3RUHqgA__; bungleme=13236427; bungleloc=lc=en&lcin=false; _ga=GA1.2.883620681.1459446075; _gat=1; bunglefrogblastventcore=1461881136"
var cookieStr=utils.config.bungieCookie
var platform = BungiePlatform(cookieStr);
// in-house libraries

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
          utils.l.d("Fetching BungieAccount deatils")
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
function sendBungieMessage(displayName,username,callback){

  utils.async.waterfall([
      function (callback) {
        //var destinySearchURL ="https://www.bungie.net/Platform/Destiny/SearchDestinyPlayer/-1/"+displayName+"/"
        var destinySearchURL =utils.config.bungieDestinySearchURL+displayName+"/"
        bungieGet(destinySearchURL,callback)
      },
      function (destinyProfile, callback) {
        var respArr = JSON.parse(destinyProfile).Response
        if(respArr[0]){
          utils.l.d("Got response "+JSON.stringify(respArr[0]))
          var memberShipType = respArr[0].membershipType
          var memberShipId=  respArr[0].membershipId

          utils.l.d("Got destiny profile memberShipId="+memberShipId+" && memberShipType="+memberShipType)
          //var bungieAcctURL ="https://www.bungie.net/Platform/User/GetBungieAccount/"+memberShipId+"/"+memberShipType+"/"
          var bungieAcctURL =utils.config.bungieUserAccountURL+memberShipId+"/"+memberShipType+"/"
          bungieGet(bungieAcctURL,callback)
        }else{
          return callback(null,null)
        }
      },
      function (bungieAcct,callback) {
        var bungieAcctResp =JSON.parse(bungieAcct).Response
        var bungieMemberShipId = bungieAcctResp.bungieNetUser.membershipId
        var psnDisplayName = bungieAcctResp.bungieNetUser.psnDisplayName
        var token = helpers.uuid.getRandomUUID()
        //var convUrl = "https://www.bungie.net/Platform/Message/CreateConversation/?lc=en&fmt=true&lcin=true"
        var convUrl = utils.config.bungieConvURL
        utils.l.d("bungieMemberShipId="+bungieMemberShipId+"---&&--- psnDisplayName="+psnDisplayName)
        var msgBody = {
          "membersToId": ["13236427", bungieMemberShipId],
          "body": getMessageBody(utils.config.hostUrl(),displayName,token,username)
        }
        bungiePost(convUrl,msgBody,token,callback)
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

function bungiePost(url,msgBody,token,callback){
  request({
    url: url,
    method: "POST",
    headers: {
      //'x-api-key':'f091c8d36c3c4a17b559c21cd489bec0', //harsha //'3beed7e811fb4f78aee0c4595eed1371',
      //'x-csrf':'4410636698596642863',
      'x-api-key': utils.config.bungieAPIToken,
      'x-csrf':utils.config.bungieCSRFToken,
      'cookie':cookieStr
    },
    body:msgBody,
    json:true
  }, function(error, response, bungieProfile) {
    if(error) {
      utils.l.s("Error getting membership"+error)
      return callback(error, null)
    } else {
      utils.l.d("response html "+JSON.stringify(bungieProfile))
      return callback(null,{bungieProfile:bungieProfile,token:token})
    }

  })
}

function getMessageBody(host,displayName,token,username){
  //var msg= "Thanks for signingup at Traveler. To verify your user account please click on the link "+host+"/api/v1/auth/verify?id="+displayName+"&token="+token+"&name="+username
  var msg= "Thanks for signingup at Traveler. To verify your user account please click on the link "+host+"/api/v1/auth/verify/"+token
  return msg
}

/*function sendBungieMessage(){


  var successCallback = errorCallback = function(data) { console.log(data) };

  platform.messageService.CreateConversation({"membersToId": ["13172709", "12269331"],"body": "test msg"},successCallback, errorCallback, null)
    .done(function(data) {
      console.log("data after conv "+data)
    })
    .fail(function(err) {
      // This is called on error
    });
}*/

module.exports={
  getBungieMemberShipJson:getBungieMemberShipJson,
  sendBungieMessage:sendBungieMessage
}