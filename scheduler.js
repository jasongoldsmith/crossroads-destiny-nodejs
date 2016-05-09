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

    var now = utils.moment().utc()
    var then = utils.moment().utc().add(200 , "minutes")
    console.log("time difference :"+utils.moment.duration(now.diff(then)).humanize())
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
  case "omitTest":
    var deleteKey = require('key-del')
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
    console.log("event"+event)
    var jsonEvent = JSON.parse(event)
    delete jsonEvent.creator.date
    utils._.map(jsonEvent.players,function(player){
      //console.log(utils._.omit(player,['date','uDate']))
      delete player.date
    })


    console.log("jsonEvent"+JSON.stringify(jsonEvent))
    var updatedEvent = deleteKey(jsonEvent,['creator.date','creator.uDate','creator.psnVerified','notifStatus','updated','created','players[date]','players[uDate]','players.psnVerified'])
    console.log("\n\nupdatedEvent"+JSON.stringify(updatedEvent))
    var updatedPlyers = utils._.map(updatedEvent.players,function(player){
      console.log(utils._.omit(player,['date','uDate']))
     return utils._.omit(player,['date','uDate'])
    })
    console.log("updatedPlyers::"+updatedPlyers)
    updatedEvent.players=updatedPlyers
    console.log("updatedEventAndPlayers"+JSON.stringify(updatedEvent))
/*
    utils._.remove(jsonEvent,function(o){
      if(utils._.has(jsonEvent.keys,['creator.date','creator.uDate','creator.psnVerified','notifStatus','updated','created','players[date]','players[uDate]','psnVerified'])) return true
    })
*/
    console.log("jsonEvent::removed"+JSON.stringify(jsonEvent))

    break
  default:
    break;
}