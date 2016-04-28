#!/usr/bin/env node

var express = require('express')
var router = express.Router()
var jobs = require('./jobs')
var utils = require('./app/utils')
var helpers = require('./app/helpers')

var hashPassword = "hashPassword"
var deleteOldFullEvents = "deleteOldFullEvents"
var destinyService = require('./app/service/destinyInterface')
var authService = require('./app/service/authService')

var command = process.argv[2]


switch(command) {
  case hashPassword:
    jobs.updatePassWord()
    break
  case deleteOldFullEvents:
    jobs.deleteOldFullEvents()
    break
  case "momentTest":
    console.log("time: "+utils.moment().add(-utils.config.triggerIntervalMinutes,"minutes").format())
  case "bugieTest":
    var response = destinyService.getBungieMemberShipJson("kaeden2010")
    console.log("final response="+response) //13172709 //sreeharshadasa //12269331
    break;
  case "bungieMsg1":
    console.log(destinyService.sendBungieMessage("kaeden2010"))
    break;
  case "uuid":
    var listInt = [1,2,3,4,5,6,7,8,9,10]

    utils.async.map(listInt, function(item) {
      console.log("token::"+helpers.uuid.getRandomUUID())
    },function(){
    })
    break;
  default:
    break;
}