var express = require('express');
var router = express.Router();
var routeUtils = require('./app/routes/routeUtils');
var utils = require('./app/utils/index');
var models = require('./app/models/index');
var helpers = require('./app/helpers');
require('./app/startup/db');
var config = require("config");
var fs = require('fs');
var passwordHash = require('password-hash');

function updatePassWord() {

  utils.async.waterfall(
    [
      function(callback) {
        models.user.getAll(callback);
      },
      function(users, callback) {
        utils.async.map(users, function(user, callback){
            if(!passwordHash.isHashed(user.passWord)) {
              user.passWord = passwordHash.generate(user.passWord);
              models.user.save(user, callback);
            }else {
              callback(null, user);
            }
        }, callback);
      }
    ],
    function(err, users) {
      utils.l.i("ADMIN : all passwords hashed All  done, exec users=", users);
      process.exit(0);
    }
  )

}



module.exports = {
  updatePassWord: updatePassWord
};