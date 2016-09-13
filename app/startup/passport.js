var LocalStrategy = require('passport-local').Strategy
var models = require('../models')
var passwordHash = require('password-hash')

module.exports = function (passport, config) {
  // serialize sessions
  passport.serializeUser(function(user, callback) {
    return callback(null, user.id)
  })

  passport.deserializeUser(function(id, callback) {
    models.user.getById(id, function (err, user) {
      return callback(err, user)
    })
  })

  var local = new LocalStrategy({
      usernameField: 'userName',
      passwordField: 'passWord',
      passReqToCallback: true
    },
    function(req, userName, password, callback) {
      var body = req.body
      if(!body.consoles) {
        models.user.getUserByData({userName:body.userName.toLowerCase().trim()}, function (err, user) {
          if(err) {
            return callback(err)
          } else if(!user) {
            return callback({error: "The username and password do not match our records."}, null)
          } else if(!passwordHash.verify(password, user.passWord)) {
            return callback({error: "The username and password do not match our records."}, null)
          } else {
            user.passWord=undefined
            return callback(null, user)
          }
        })
      } else {
        models.user.getUserByData({
          consoles: {
            $elemMatch: {
              consoleType: body.consoles.consoleType,
              consoleId: {$regex : new RegExp(body.consoles.consoleId, "i")}
            }
          }
        },
          function (err, user) {
            if (err) {
              return callback(err)
            } else if (!user) {
              return callback(null, null)
            } else if (!passwordHash.verify(password, user.passWord)) {
              return callback({error: "The username and password do not match our records."}, null)
            } else {
              user.passWord = undefined
              return callback(null, user)
            }
          }
        )
      }
    }
  )
  passport.use(local)
}