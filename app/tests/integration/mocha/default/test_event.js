var utils = require("../../../../utils")
var models = require("../../../../models")
var helpers = require('../../../../helpers')
var mongoose = require('mongoose')
var loginDataProvider = require('../../../data/utils/loginUtils')
var service = require('../../../../service')

describe("Successful event test cases: ", function() {

  this.timeout(30000)
  describe("test create event: ", function() {
    var loginData = {}
    loginData.consoleType = "PS4"

    before(function(done) {
      loginDataProvider.loginUser("sreeharshadasa","PS4",null,function(err,userObj){
        user = userObj
        done()
      })
    })

    it("create a new event: ", function(done) {
      var eventObj = null
      utils.async.waterfall([
        // login first user
        function (callback) {
          loginDataProvider.loginUser("sreeharshadasa","PS4", null, callback)
        },
        // create event
        function (user, callback) {
          var data = {
            "eType": "56df5421dac7e703003a0f5c",
            "minPlayers": 1,
            "maxPlayers": 6
          }
          service.eventService.createEvent(user, data, function(err, event) {
            if(err) {
              return callback(err, event)
            }
            eventObj = event
            validateSuccessfulEventCreate(event)
            return callback(null, event)
          })
        },
        // login second user
        function (event, callback) {
          loginDataProvider.loginUser("CrossroadsTina","PS4", null, callback)
        },
        // make second user join the event
        function (user, callback) {
          var data = {
            eId: eventObj._id
          }
          service.eventService.joinEvent(user, data, function(err, event) {
            if(err) {
              return callback(err, event)
            }
            validateSuccessfulEventJoin(event, user)
            return callback(null, user)
          })
        },
        // make the user leave the event
        function (user, callback) {
          var data = {
            eId: eventObj._id
          }
          service.eventService.leaveEvent(user, data, function(err, event) {
            if(err) {
              return callback(err, event)
            }
            validateSuccessfulEventLeave(event, user)
            return callback(null, user)
          })
        }
      ],
      function (err, result) {
        if(!err) {
          done()
        }
      })
    })
  })

  after(function() {
    utils.l.d("Removing user",user)
    models.user.model.remove({_id:user._id},function(err,data){})
    models.userGroup.model.remove({"user" : user._id},function(err,data){})
    models.eventInvitation.model.remove({"inviter" : user._id},function(err,data){})
    models.eventInvitation.model.remove({"invitee" : user._id},function(err,data){})
    models.event.model.remove({"players" : user._id},function(err,data){})
  })
})

function validateSuccessfulEventCreate(event) {
  console.log("event2" + event)
  utils.assert.isDefined(event._id, "Event id not defined in event object")
  utils.assert.isDefined(event.creator, "Event creator not defined in event object")
  utils.assert.isArray(event.players, "Event players not defined in event object")
}

function validateSuccessfulEventJoin(event, player) {
  utils.assert.equal(utils.IsUserPartOfTheEvent(player, event), true, "Expected player to be part of event")
}

function validateSuccessfulEventLeave(event, player) {
  utils.assert.equal(utils.IsUserPartOfTheEvent(player, event), false, "Expected player to not be a part of event")
}