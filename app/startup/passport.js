var utils = require('../utils');
var LocalStrategy = require('passport-local').Strategy;
var models = require('../models');

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
      passwordField: 'passWord',
      passReqToCallback: true
    },
    function(req, userName, password, done) {
      utils.l.i("passport, userName= ",userName);
      utils.l.i("passport, password= ",password);
      utils.l.i("passport, uniqueId= ",req.body.uniqueID);
      models.user.getUserByData({userName:userName, passWord: password, uniqueID: req.body.uniqueID}, function (err, user) {
        if (err) return done(err);
        if (!user) {
          return done(null, false, { message: 'Unknown user' });
        }
        return done(null, user);
      });
    }
  );
  passport.use(local);

};