var express = require('express')
var routeUtils = require('./app/routes/routeUtils')
var utils = require('./app/utils/index')
var models = require('./app/models/index')
var helpers = require('./app/helpers')
require('./app/startup/db')
var config = require("config")
var fs = require('fs')
var passwordHash = require('password-hash')

function updatePassWord() {

  utils.async.waterfall(
    [
      function(callback) {
        models.user.getAll(callback)
      },
      function(users, callback) {
        utils.async.map(users, function(user, callback){
            if(!passwordHash.isHashed(user.passWord)) {
              user.passWord = passwordHash.generate(user.passWord)
              models.user.save(user, callback)
            }else {
              callback(null, user)
            }
        }, callback)
      }
    ],
    function(err, users) {
      utils.l.i("ADMIN : all passwords hashed All  done, exec users=", users)
      process.exit(0)
    }
  )

}

function deleteOldFullEvents() {
  utils.async.waterfall([
    function (callback) {
      var date = new Date()
      models.event.getByQuery({ "status":"full", launchDate:{ $lt: date }}, null, callback)
    },
    function (events, callback) {
      utils._.forEach(events, function(event) {
        utils.l.i("job archiving event: ", event)
        models.archiveEvent.createArchiveEvent(event, callback)
        utils.l.i("job removing event: ", event)
        event.remove(callback)
      })
    }
  ],
  function (err, event) {
    if (err) {
      utils.l.i("job unable to remove event due to: ", err)
    } else {
      utils.l.i("job removed events succesfully")
    }
  })
}

function deleteOldStaleEvents() {
  utils.async.waterfall([
      function (callback) {
        models.event.getByQuery({ launchStatus: "now"}, null, callback)
      },
      function(events, callback) {
        var currentTime = new Date(moment.tz(Date.now(), 'America/Los_Angeles').format())
        utils._.forEach(events, function(event) {
          var launchDate = new Date(moment.tz(event.launchDate, 'America/Los_Angeles').format())
          if(utils.format.compareDates(launchDate, currentTime) > 0) {
            utils.l.i("job archiving event: ", event)
            models.archiveEvent.createArchiveEvent(event, callback)
            utils.l.i("job removing event: ", event)
            event.remove(callback)
          }
        })
      },
    ],
    function (err, event) {
      if (err) {
        utils.l.i("job unable to remove event due to: ", err)
      } else {
        utils.l.i("job removed events succesfully")
      }
    })
}

module.exports = {
  updatePassWord: updatePassWord,
  deleteOldFullEvents: deleteOldFullEvents,
  deleteOldStaleEvents: deleteOldStaleEvents
}