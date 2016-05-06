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
    var date = new Date()
    date.setHours(0,0,0,0)
    var date1 =  utils.moment(date).utc().format()
    console.log("date1:"+date1)
    var date2 = utils.moment(date).utc().add(24,"hours").format()
    console.log("date2::"+date2)
    //console.log("date1::"+date1.year()+"-"+date1.month()+"-"+date1.day())
    console.log("time: "+utils.moment().add(-utils.config.triggerIntervalMinutes,"minutes").format())
    break;
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
  case 'arrayTest':
    models.event.getByQuery({_id:"572ad94e2cc2139d75c6afd8"},null,function(err, event){
      if(event){
        console.log("event:"+event)
        var jsonEvt = JSON.parse(JSON.stringify(event))
        console.log("status::"+jsonEvt.launchDate)
        console.log("finding::"+utils._.has(event.notifStatus,"EventLf1mNotification"))
      }
    })
    break
  default:
    break;
}