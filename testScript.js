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

  default:
    return;
}