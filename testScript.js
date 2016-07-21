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
    var console = utils.primaryConsole(userObj).consoleType
    utils.l.d("primary console",console)
    utils.l.d("index of primary console",utils.primaryConsoleIndex(userObj))
    break;
  default:
    return;
}