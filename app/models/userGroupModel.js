var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')

// User Schema
var UserGroupSchema = require('./schema/userGroupSchema')

// Model initialization
var UserGroup = mongoose.model('UserGroup', UserGroupSchema.schema)

// Public functions
function updateUserGroup(userId,groupId, data, callback) {
  var query={}
  if(utils._.isValidNonBlank(userId))
    query.user=userId
  if(utils._.isValidNonBlank(groupId))
    query.group=groupId
  UserGroup.update(query,{"$set":data},{multi:true},callback)
}

//Remove existing usergroups and add new usergroups with mute notification flag.
function refreshUserGroup(user,groups,userGroupLst,callback){
  utils.l.d("Refreshing groups...1111",userGroupLst)
  utils.async.waterfall([
    function(callback){
      UserGroup.collection.remove({user:user._id},callback)
    },function(docsRemoved, callback){
      var userGroups = []
      utils._.map(groups,function(groupObj){
        var userGroup = utils._.isValidNonBlank(userGroupLst) ?utils._.find(userGroupLst,{group:groupObj.groupId}):null
        userGroups.push({
          user:user._id,
          refreshGroups:false,
          group:groupObj.groupId,
          consoles:utils._.map(user.consoles,"consoleType"),
          muteNotification:utils._.isValidNonBlank(userGroup)?userGroup.muteNotification:false,
          date:new Date(),
          uDate:new Date()
        })
      })

      //Add free lance group
      userGroups.push({
        user:user._id,
        refreshGroups:false,
        group:utils.constants.freelanceBungieGroup.groupId,
        consoles:utils._.map(user.consoles,"consoleType"),
        muteNotification:utils._.isValidNonBlank(userGroupLst)?userGroupLst.muteNotification:false,
        date:new Date(),
        uDate:new Date()
      })

      utils.l.d("Refreshing groups...2222",userGroups)
      UserGroup.collection.insert(userGroups,callback)
    },function(docs, callback){
      getByUser(user._id,callback)

    }
  ],callback)
}

function getByUser(userId, callback) {
  UserGroup
    .find({user:userId}).populate("group")
    .exec(callback)
}

function getUsersByGroup(groupId,muteNotification, consoleType,callback){
  var query = {
    group: groupId,
    consoles: consoleType
  }
  if(utils._.isValidNonBlank(muteNotification))
    query.muteNotification = muteNotification

      //TODO: Remove populate when noitifcation service is refactored to use only users
  UserGroup
    .find(query)
    .select("user")
    .populate("user")
    .exec(function(err,data){
      if(!err) return callback(null,utils._.map(data,"user"))
      else return callback(err,null)
    })
}

function getGroupCountByConsole(groupId,consoleType,callback){
  UserGroup.count({group:groupId,consoles:consoleType}).exec(callback)
}

module.exports = {
  model: UserGroup,
  updateUserGroup:updateUserGroup,
  getUsersByGroup:getUsersByGroup,
  getByUser:getByUser,
  refreshUserGroup:refreshUserGroup,
  getGroupCountByConsole:getGroupCountByConsole
}
