var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')

// User Schema
var UserGroupSchema = require('./schema/userGroupSchema')

// Model initialization
var UserGroup = mongoose.model('UserGroup', UserGroupSchema.schema)

// Public functions
function updateUserGroup(userId, groups, callback) {
  getByUser(userId, function(err, userGroup) {
    if (!err){
      userGroup = userGroup ? utils._.extend(userGroup, {groups:groups}):new UserGroup({user:userId,groups:groups})
      save(userGroup, callback)
    }else
      return callback(err)
  })
}

function getByQuery(query, callback) {
  UserGroup
    .find(query)
    .exec(callback)
}

function getByUser(userId, callback) {
  UserGroup
    .findOne({user:userId})
    .exec(callback)
}

function save(userGroup, callback) {
  utils.async.waterfall([
    function(callback) {
      // We need this as groups is mixed type
      userGroup.markModified('groups')
      userGroup.save(function (err, c, numAffected) {
        if (err) {
          utils.l.s("Got error on saving userGroup", {err: err, userGroup: userGroup})
        } else if (!c) {
          utils.l.s("Got null on saving userGroup", {userGroup: userGroup})
        }
        return callback(err, c)
      })
    }],
    callback
  )
}

function deleteUserGroup(userId, callback) {
  utils.async.waterfall([
      function(callback) {
        UserGroup.findOne({user: userId}, callback)
      },
      function(userGroup, callback) {
        if(!userGroup) {
          return callback({error: "userGroup with this id does not exist"}, null)
        }
        utils.l.d("Deleting the userGroup")
        userGroup.remove(callback)
      }
    ],
    callback
  )
}

module.exports = {
  model: UserGroup,
  updateUserGroup:updateUserGroup,
  deleteUserGroup:deleteUserGroup,
  getByQuery:getByQuery,
  getByUser:getByUser
}
