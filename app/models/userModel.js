var utils = require('../utils');
var mongoose = require('mongoose');
var helpers = require('../helpers');

// User Schema
var UserSchema = require('./schema/userSchema');


// Model initialization
var User = mongoose.model('User', UserSchema.schema);

// Public functions
function setFields(user_id, data, callback) {
  getById(user_id, function(err, user) {
    if (err)
      return callback(err);

    utils._.extend(user, data);
    save(user, callback)
  });
}

function getById(id, callback) {
  if (!id) return callback("Invalid id:" + id);

  User.findById(id, callback);
}

function getByIds(ids, callback) {
  //if (!ids || ids.length == 0) return callback("Invalid ids:" + ids);

  User.find({ '_id': { '$in': ids }}, callback);
}


function save(user, callback) {
  user.save(function(err, u, numAffected) {
    if (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        // ignore this case
        utils.l.i("User exist while signup.  Its normal we will now update this user field");
      }
      else
      {
        utils.l.s("Got error on saving user", {err: err, user: user})
      }
    } else if (!u) {
      utils.l.s("Got null user on saving user", {user: user})
    } else {
      helpers.m.setPeopleProps(u);
    }
    return callback(err, u);
  });
}



function deleteUser(user, callback) {
  utils.async.waterfall([
        function(callback) {
          if (!user) {
            callback("User is null");
          }
          user.remove(function (err, c, numAffected) {

            if (err) {
              utils.l.s("Got error on removing user", {err: err, user: user})
            } else if (!c) {
              utils.l.s("Got null chat on saving user", {user: user})
            }
            callback(null, mResult);

          });
        }
      ],
      callback)

}


function createUserFromData(data, callback) {

  utils.async.waterfall([
    function(callback)  {
      var user = new User(data);
      save(user, callback);
    }
  ], function(err, user) {
    if (err) {
      return callback(err);
    }
    callback(null, user);
  });

}


function getUserByData(data, callback) {
  utils.l.i("getUserByData, data= ",data);
  User.findOne(data, function(err, user) {
    if(err) {
      utils.l.i("getUserByData, err= ",err);
      callback(err);
    }else {
      utils.l.i("getUserByData, user= ",user);
      callback(null, user);
    }
  });
}


function getAll(callback) {
  User.find({}, callback);
}


module.exports = {
  model: User,
  getById: getById,
  getByIds: getByIds,
  setFields: setFields,
  save: save,
  deleteUser: deleteUser,
  getUserByData: getUserByData,
  createUserFromData: createUserFromData,
  getAll: getAll
};
