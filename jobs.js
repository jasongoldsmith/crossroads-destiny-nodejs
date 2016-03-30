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
      //date.setMinutes(date.getMinutes() + 10)
      models.event.getByQuery({ "status":"full", launchDate:{ $lt: date }}, callback)
    },
    function (events, callback) {
      utils._.forEach(events, function(event) {
        utils.l.d("job archiving event: " + event)
        models.archiveEvent.createArchiveEvent(event, callback)
        utils.l.d("job removing event: " + event)
        event.remove(callback)
      })
    }
  ],
  function (err, event) {
    if (err) {
      utils.l.i("job unable to remove event due to: " + err)
    } else {
      utils.l.i("job removed events succesfully")
    }
  })
}



module.exports = {
  updatePassWord: updatePassWord,
  deleteOldFullEvents: deleteOldFullEvents
}