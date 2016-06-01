var express = require('express')
var router = express.Router()
var config = require('config')
var utils = require('../../../utils')
var helpers = require('../../../helpers')
var routeUtils = require('../../routeUtils')
var models = require('../../../models')
var service = require('../../../service/index')

function listMyGroups(req,res){
  listGroups(req.user, function(err, groups) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      utils.l.d("Bungie groups response ::",groups)
      groupsResponse = groups || [{}]
      routeUtils.handleAPISuccess(req, res, groupsResponse)
    }
  })
}

function listGroups(user,callback){
  var groupList = null
  var userObj = null
  utils.async.waterfall([
      function (callback) {
        models.user.getUserById({id:user._id},callback)
      },
      function(user,callback){
        if(user) {
          userObj = user
          //TODO: set current page to 1 for now. Change it when we have paging for groups.
          service.destinyInerface.listBungieGroupsJoined(user.bungieMemberShipId, user.psnId,1, callback)
        }else return callback({error:"User doesnot exist/logged in."})
      },function(groups,callback){
        if(groups) {
          groupList = groups
          groupList.push(utils.constants.freelanceBungieGroup)
          models.user.updateUser(mergeGroups(userObj,groupList),false,function(err,user){
            if(user) service.eventService.listEventCountByGroups(utils._.map(groupList, 'groupId'),callback)
            else return callback(err,null)
          })
        }else return callback(null, null)
      },function(eventCounts, callback){
        mergeEventStatsWithGroups(eventCounts,groupList, callback)
      },function(groupEventStatsList,callback){
        groupList = groupEventStatsList
        service.authService.listMemberCountByClan(utils._.map(groupList, 'groupId'),callback)
      },function(memberCounts,callback){
        mergeMemberStatsWithGroups(memberCounts,groupList,callback)
      }
    ],
  callback
  )
}

function resendBungieMessage(req,res){
  handleResendBungieMessage(req.user, function(err, user) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, user)
    }
  })
}
function handleResendBungieMessage(userData,callback){
  utils.async.waterfall(
    [
      function(callback) {
        //TBD: membershiptype is hardcoded to PSN for now. When we introduce multiple channels change this to take it from userdata
        // or send notification to both xbox and psn depending on the ID availability
        if(utils.config.enableBungieIntegration) {
          console.log("Destiny validation enabled")
          service.destinyInerface.sendBungieMessage(userData.psnId, "PSN", utils.constants.bungieMessageTypes.accountVerification, function (error, messageResponse) {
            utils.l.d('handleResendBungieMessage::messageResponse',messageResponse)
            utils.l.d('handleResendBungieMessage::signupUser::sendBungieMessage::error',error)
            if (messageResponse) {
              utils.l.d("messageResponse::token===" + messageResponse.token)
              var newUserObj = {
                id:userData._id,
                psnVerified:"INITIATED",
                psnToken: messageResponse.token,
                bungieMemberShipId : messageResponse.bungieMemberShipId
              }
              callback(null, newUserObj)
            } else {
              return callback(error, null)
            }
          })
        }else {
          console.log("Destiny validation disabled")
          callback(null, null)
        }
      },function (newUser, callback) {
        if(newUser) models.user.updateUser(newUser, false, callback)  // don't send message
        else callback(null, userData)
      }
    ],
    callback
  )
}

function searchGroupReq(req,res){
  searchGroup(req.user, req.param('groupId'),function(err, groups) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, groups)
    }
  })
}

function searchGroup(user,groupId,callback){
  var userObj = null
  var groupList = null
  utils.async.waterfall([
      function (callback) {
        models.user.getUserById({id:user._id},callback)
      },
      function(user,callback){
        if(user) {
          userObj = user
          //TODO: set current page to 1 for now. Change it when we have paging for groups.
          service.destinyInerface.listBungieGroupsJoined(user.bungieMemberShipId, user.psnId,1, callback)
        }else return callback({error:"User doesnot exist/logged in."})
      },function(groups,callback){
        if(groups) {
          groupList = groups
          service.eventService.listEventCountByGroups(utils._.map(groups, 'groupId'), callback)
        }else return callback(null, null)
      },function(eventCounts, callback){
        mergeEventStatsWithGroups(eventCounts,groupList, callback)
      }
    ],
    function(err, bungieGroups){
      if(err) return callback(err, null)
      else{
        utils.l.d("Groups::"+JSON.stringify(bungieGroups))
        return callback(null,utils._.head(utils._.filter(bungieGroups,{groupId:groupId})))
      }
    }
  )
}

function mergeEventStatsWithGroups(eventCountList,groupList, callback){
  var groupUpdatedList = null
  if(eventCountList){
    //groupList = {groupList:groupList,eventStats:eventCounts}
    groupUpdatedList = utils._.map(JSON.parse(JSON.stringify(groupList)),function(group){
      var eventCount = utils._.find(eventCountList,{"_id":group.groupId})
      if(eventCount) group.eventCount=eventCount.count
      return group
    })
  }else groupUpdatedList = groupList

  return callback(null, groupUpdatedList)
}

function mergeMemberStatsWithGroups(memberCounts,groupList, callback){
  var groupUpdatedList = null
  if(memberCounts){
    //groupList = {groupList:groupList,eventStats:eventCounts}
    groupUpdatedList = utils._.map(JSON.parse(JSON.stringify(groupList)),function(group){
      var userCount = utils._.find(memberCounts,{"_id":group.groupId})
      if(userCount) group.memberCount=userCount.count
      return group
    })
  }else groupUpdatedList = groupList

  return callback(null, groupUpdatedList)
}

function mergeGroups(user,bungieGroups){
  var bungieGroupIds = utils._.map(bungieGroups, 'groupId')
  var updatedGroups = utils._.map(bungieGroupIds,function(bungieId){
    var userGroup = utils._.find(user.groups,{groupId:bungieId})
    if(!userGroup) return {groupId:bungieId,muteNotification:false}
    else return userGroup
  })

  utils.l.d("mergeGroups",updatedGroups)
  return {id:user._id,groups:updatedGroups}
}
/** Routes */
routeUtils.rGet(router, '/group/list', 'listMyGroups', listMyGroups)
routeUtils.rGet(router, '/group/search/:groupId', 'searchGroupById', searchGroupReq)
routeUtils.rGet(router, '/group/resendBungieMessage', 'resendBungieMessage', resendBungieMessage)
module.exports = router

