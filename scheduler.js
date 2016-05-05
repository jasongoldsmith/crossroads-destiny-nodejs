#!/usr/bin/env node

var express = require('express')
var router = express.Router()
var jobs = require('./jobs')
var utils = require('./app/utils')
var helpers = require('./app/helpers')
var schedule = require('node-schedule');

var hashPassword = "hashPassword"
var deleteOldFullEvents = "deleteOldFullEvents"
var destinyService = require('./app/service/destinyInterface')
var authService = require('./app/service/authService')
var notifService = require('./app/service/eventNotificationService')

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
  case 'notifService':
    notifService.handleNotificationTrigger({triggerName:'launchUpcomingEvents',schedule:'*/1 * * * *'});
    break;
  case 'scheduleTst':
    var j = schedule.scheduleJob("test schedule123",'*/1 * * * *',function(){
      console.log("executing job @"+new Date())
    })
    console.log("job name="+ j.name)
    break;
  case 'groupTest':
    var events = [{id:1,creator:{name:"h",msg:'hi'}},{id:2,creator:{name:"b",msg:'hi'}},{id:3,creator:{name:"h",msg:'hi'}},{id:4,creator:{name:"h",msg:'hi'}}]
    var eventsByName = utils._.countBy(events,'creator.name')
    for(var attributename in eventsByName){
      console.log(attributename+": "+eventsByName[attributename]);
    }
    break;
  default:
    break;
}