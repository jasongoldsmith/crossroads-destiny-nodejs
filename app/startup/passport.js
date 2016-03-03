var utils = require('../utils');
var LocalStrategy = require('passport-local').Strategy;
var models = require('../models');
var passwordHash = require('password-hash');

module.exports = function (passport, config) {
  // serialize sessions
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    models.user.getById(id, function (err, user) {
      done(err, user)
    });
  });

  var local = new LocalStrategy({
      usernameField: 'userName',
      passwordField: 'passWord'
    },
    function( userName, password, done) {
      models.user.getUserByData({userName:userName.toLowerCase()}, function (err, user) {
        if (err) return done(err);
        if (!user) {
          return done(null, false, { message: 'Unknown user' });
        }
        if (!passwordHash.verify(password, user.passWord)/*!utils._.isEqual(user.passWord, password)*/) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        user.passWord=undefined;
        return done(null, user);
      });
    }
  );
  passport.use(local);

};