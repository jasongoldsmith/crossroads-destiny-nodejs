#!/usr/bin/env node

var express = require('express')
var router = express.Router()
var jobs = require('./jobs')
var utils = require('./app/utils')
var helpers = require('./app/helpers')
var models = require('./app/models')
var schedule = require('node-schedule');

var hashPassword = "hashPassword"
var deleteOldFullEvents = "deleteOldFullEvents"
var deleteOldStaleEvents = "deleteOldStaleEvents"
var upcomingEventsReminder = "upcomingEventsReminder"
var eventFullReminder = "eventFullReminder"
var eventStartReminder = "eventStartReminder"
var dailyOneTimeReminder = "dailyOneTimeReminder"
var eventUpcomingReminder = "eventUpcomingReminder"

var destinyService = require('./app/service/destinyInterface')
var userService = require('./app/service/userService')
var authService = require('./app/service/authService')
var notifService = require('./app/service/eventNotificationService')

var command = process.argv[2]
var event ='{'+
  '"_id": "572ce86427efb203002ea3f6",'+
  '"status": "can_join",'+
  '"creator":'+
  '{ "_id": "572ce20e27efb203002ea3d9",'+
  '"date": "Fri May 06 2016 18:27:26 GMT+0000 (UTC)",'+
  '"uDate": "Fri May 06 2016 18:30:33 GMT+0000 (UTC)",'+
  '"userName": "unteins"'+
  '},'+
  '"eType":'+
  '{ "_id": "56c647568162210300101953",'+
  '"aType": "Raid"},'+
  '"maxPlayers": "6",'+
  '"updated": "Fri May 06 2016 19:13:11 GMT+0000 (UTC)",'+
  '"created": "Fri May 06 2016 18:54:28 GMT+0000 (UTC)",'+
  '"players":'+
  '[ { "_id": "572ce20e27efb203002ea3d9",'+
  '"date": "Fri May 06 2016 18:27:26 GMT+0000 (UTC)",'+
  '"uDate": "Fri May 06 2016 18:30:33 GMT+0000 (UTC)",'+
  '"userName": "unteins"'+
  '},'+
  '{ "_id": "572ce20e27efb20307745666",'+
  '"date": "Fri May 06 2016 18:27:26 GMT+0000 (UTC)",'+
  '"uDate": "Fri May 06 2016 18:30:33 GMT+0000 (UTC)",'+
  '"userName": "unteins"'+
  '}'+
  '],'+
  '"launchStatus": "now"'+
  '}'

var objArray = []
objArray.push({user:"abc","dateTime":"2016-06-09T22:37:49Z"})
objArray.push({user:"abc","dateTime":"2016-06-07T20:37:49Z"})
objArray.push({user:"abc","dateTime":"2016-06-09T20:37:49Z"})

var objArray1= []
objArray1.push({user:"def","dateTime":"2016-07-09T22:37:49Z"})
objArray1.push({user:"def","dateTime":"2016-07-07T20:37:49Z"})
objArray1.push({user:"def","dateTime":"2016-06-09T20:37:49Z"})

var obj = {
  usr1: {
    user: "abc",
    "dateTime": "2016-06-09T20:37:49Z",
  },
  usr2: {
    user: "def",
    "dateTime": "2016-06-09T20:37:49Z",
  },
  usr3: {
    user: "ghi",
    "dateTime": "2016-06-09T20:37:49Z",
  }
}
switch(command) {
  case "helmetTest":
    destinyService.getBungieHelmet("sreeharshadasa","PS4",function(err,helmetURL){
      utils.l.d("err:",err)
      utils.l.d("helmentURL",helmetURL)
    })
    break;
  case "sortTest":
    var sortedArray = utils._.sortBy(objArray,function(item){
      return utils.moment(item.dateTime)
    })
    utils.l.d("sortedArray",sortedArray)
    break;
  case "mergeTest":
    var arrays = []
    arrays.push(objArray)
    arrays.push(objArray1)
    var mergedArray = utils._.flatMap(arrays)
    utils.l.d("mergedArray",mergedArray)
    var mergedSortedArray = utils._.sortBy(utils._.flatMap(arrays),function(item){
      return utils.moment(item.dateTime)
    })
    utils.l.d("mergedSortedArray",mergedSortedArray)
  case "valueTest":
    var mapVal = utils._.mapValues(obj,function(value){
      if(value.user == "def")
        return value.user
    })
    utils.l.d("mapVal"+JSON.stringify(mapVal))
    utils.l.d("mapVal",utils._.compact(utils._.values(mapVal)))
  case "characterTest":
    var charObj = require("/Users/dasasr/projects/traveler/bungie/characters.json");
    var characterId = "2305843009392124098"
    var membershipId = "4611686018460471566" //"4611686018460342882"
   // var destinyAcct = utils._.filter(charObj.Response.destinyAccounts.userInfo,{"membershipId":"4611686018446478621"})

    //var destinyAcct = utils._.find(charObj,{"Response.destinyAccounts.characters.characterId":characterId})
/*    var destinyAcct = utils._.find(charObj, utils._.flow(
      utils._.property('Response.destinyAccounts'),
      utils._.partialRight(utils._.some, { "userInfo.membershipId": "4611686018446478621" })
    ));*/

    var characters = null
      utils._.map(charObj.Response.destinyAccounts, function(account){
        utils.l.d('account.userInfo.membershipId',account.userInfo.membershipId)
      if(account.userInfo.membershipId.toString() == membershipId.toString())
        characters= account.characters
    })

    //utils.l.d("destinyAcct",destinyAcct)
    //var characters = utils._.map(charObj.Response.destinyAccounts,"characters")
    var sortedChars = utils._.sortBy(utils._.flatMap(characters),function(character){
      return utils.moment(character.dateLastPlayed)
    })

    var lastCharacter = utils._.last(sortedChars)
    utils.l.d('lastCharacter',{characterId:lastCharacter.characterId,membershipId:lastCharacter.membershipId,membershipType:lastCharacter.membershipType})
    break;
  case "consoleTest":
    var userObj = require("/Users/dasasr/projects/traveler/tmp/user.json");
    var consoleObj = utils.primaryConsole(userObj).consoleType
    utils.l.d("primary console",consoleObj)
    utils.l.d("index of primary console",utils.primaryConsoleIndex(userObj))
    break;
  case "reduceTest":
    var userGroups = require("/Users/dasasr/projects/traveler/tmp/usergroups.json");
    var userGroupFlat = utils._.flatMap(userGroups.users,function(userGroup){
      var userId = userGroup._id
      var results = []
      utils._.map(userGroup.groups,function(group){
        result = userId+","
        result = result + group.groupId
        results.push(result)
      })
      return results
    })
    console.log(userGroupFlat)
    break;
  case "momentTest":
    var estTime = utils.moment.tz(Date.now(), 'America/New_York').utc().format()
    console.log("estTime::"+estTime)
    break;
  case "messageFormat":
    var evt = require("/Users/dasasr/projects/traveler/tmp/event.json");
    var message = notifService.formatMessage("#PLAYERS_PREFIX_TXT##PLAYERS_COUNT_NEEDED##PLAYERS_NEEDED_TXT##EVENT_NAME#. If you are still interested, please tap to confirm.",evt,null,null)
    console.log("message::"+message)
    break
  case "activityData":
    var activities = require('/Users/dasasr/projects/traveler/admin/activities.json')
    var mods = require('/Users/dasasr/projects/traveler/admin/modifiers.json')
    var tags = require('/Users/dasasr/projects/traveler/admin/tags.json')

    var activitiesResp = []
    utils._.map(activities, function(a){
      var ar = {}
      ar.aType=a.aType
      ar.aSubType=a.aSubType
      ar.aCheckpoint= a.aCheckpoint
      ar.aCheckpointOrder = a.aCheckpointOrder
      ar.aDifficulty = a.aDifficulty
      ar.aModifiers = []
      var modifierItems = a.aModifier.toString().split(',')
      var modResp = []
      //loop through modifiers for each modifier
      utils._.map(modifierItems,function(modifier){
        var m = utils._.find(mods,{Type:"aModifier",Name:modifier.trim()})
        if(m) {
          var mResp = {}
          mResp.aModifierName = m.Name
          mResp.aModifierInfo = m.Description
          mResp.aModifierIconURL = m.Icon
          mResp.isActive = true
          modResp.push(mResp)
        }
      })
      ar.aModifiers = modResp

      var bonusLst = a.aBonus.toString().split(',')
      var bonusLstResp = []
      //loop through bonusLst for each bonus
      utils._.map(bonusLst,function(bonus){
        var m = utils._.find(mods,{Type:"aBonus",Name:bonus.trim()})
        if(m) {
          var bResp = {}
          bResp.aBonusName = m.Name
          bResp.aBonusInfo = m.Description
          bResp.aBonusIconURL = m.Icon
          bResp.isActive = true
          bonusLstResp.push(bResp)
        }
      })
      ar.aBonus = bonusLstResp

      var location = {}
      location.aDirectorLocation= a.aDirectorLocation
      location.aSubLocation = a.aSubLocation
      ar.aDescription = a.aDescription
      ar.aStory = a.aStory
      ar.aLight= a.aLight
      ar.aLevel= a.aLevel
      ar.aIconUrl= a.aIconUrl
      ar.isActive= a.isActive
      ar.isFeatured= a.isFeatured
      var adCard = {}
      adCard.isAdCard= a.isAdCard
/*
      adCard.adCardBaseUrl= a.adCardBaseUrl
      adCard.adCardImagePath
      adCard.adCardHeader
      adCard.adCardSubHeader
*/
      ar.adCard = adCard
      var img = {}
/*
      img.aImageBaseUrl
      img.aImageImagePath
*/
      ar.aImage= img
      ar.minPlayers= a.minPlayers
      ar.maxPlayers= a.maxPlayers

      //loop through tags for aType
      var tagJson = utils._.find(tags,{aType: a.aType})
      var tagItems = tagJson.Tags.toString().split(',')
      utils._.map(tagItems, function(tagName){
        var arLocal = ar
        arLocal.tag = tagName
        activitiesResp.push(arLocal)
      })
    })
    utils.l.d("activitiesResp",activitiesResp)
  break;
  default:
    return;
}