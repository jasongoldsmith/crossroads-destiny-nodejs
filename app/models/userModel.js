var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')

// User Schema
var UserSchema = require('./schema/userSchema')


// Model initialization
var User = mongoose.model('User', UserSchema.schema)

//static variables
var roundRobinCount = 0

// Public functions
function setFields(user_id, data, callback) {
  getById(user_id, function(err, user) {
    if (err)
      return callback(err)

    utils._.extend(user, data)
    save(user, callback)
  })
}

function getByQuery(query, callback) {
  User
    .find(query)
    .select("-passWord")
    .exec(callback)
}


function getById(id, callback) {
  if (!id) return callback("Invalid id:" + id)
  getByQuery({'_id':id}, utils.firstInArrayCallback(callback))
}

function getByIds(ids, callback) {
  if (utils._.isEmpty(ids)) return callback("Invalid ids:" + ids)
  getByQuery({ '_id': { '$in': ids }}, callback)
}


function save(user, callback) {
  utils.async.waterfall([
    function(callback) {
      user.save(function(err, c, numAffected) {
        if (err) {
          utils.l.s("Got error on saving user", {err: err, user: user})
        } else if (!c) {
          utils.l.s("Got null on saving user", {user: user})
        }
        return callback(err, c)
      })
    },
    function(c, callback) {
      getById(c._id, callback)
    }
  ], callback)
}



function deleteUser(user, callback) {
  utils.async.waterfall([
        function(callback) {
          if (!user) {
            callback("User is null")
          }
          user.remove(function (err, c, numAffected) {

            if (err) {
              utils.l.s("Got error on removing user", {err: err, user: user})
            } else if (!c) {
              utils.l.s("Got null chat on saving user", {user: user})
            }
            callback(null, mResult)

          })
        }
      ],
      callback)

}


function handleMissingImageUrl(data) {
  if (!data.imageUrl) {
    utils.l.d("no image URL found")
    var imageFiles = utils.constants.imageFiles
    data.imageUrl = utils.constants.baseUrl + imageFiles[roundRobinCount % imageFiles.length]
    utils.l.d("image URL round robin count = " + roundRobinCount)
    utils.l.d("image files length = " + imageFiles.length)
    roundRobinCount++
		}
}

function createUserFromData(data, callback) {
  handleMissingImageUrl(data)
  var user = new User(data)
  utils.l.d("image Url assigned: " + data.imageUrl)
  save(user, callback)
}


function getUserByData(data, callback) {
  User.find(data)
    .exec(utils.firstInArrayCallback(callback))
}


function getAll(callback) {
  getByQuery({}, callback)
}

function getUserById(data, callback) {
  utils.async.waterfall([
      function (callback) {
        User.findOne({_id: data.id}, callback)
      },
      function(user, callback) {
        if (!user) {
          utils.l.i("no user found")
          return callback({ error: "user with this id does not exist" }, null)
        } else {
          utils.l.i("found user: " + JSON.stringify(user))
          return callback(null, user)
        }
      }
  ],
    callback
  )
}

function listUsers(callback) {
  getAll(callback)
}


function updateUser(data, callback) {
  utils.async.waterfall([
      function (callback) {
        getById(data.id, callback)
      },
      function(user, callback) {
        if (!user) {
          utils.l.i("no user found")
          return callback({ error: "user with this id does not exist" }, null)
        } else {
          utils.l.i("found user: " + JSON.stringify(user))
          utils._.extend(user, data)
          user.save(callback)
        }
      }
    ],
    callback)
}


module.exports = {
  model: User,
  getUserById: getUserById,
  getByIds: getByIds,
  listUsers:listUsers,
  setFields: setFields,
  save: save,
  deleteUser: deleteUser,
  getUserByData: getUserByData,
  createUserFromData: createUserFromData,
  getAll: getAll,
  getById: getById,
  updateUser: updateUser
}
