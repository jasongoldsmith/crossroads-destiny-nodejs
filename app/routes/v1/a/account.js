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
  utils.async.waterfall([
      function (callback) {
        models.user.getUserById({id:user._id},callback)
      },
      function(user,callback){
        if(user) {
          //TODO: set current page to 1 for now. Change it when we have paging for groups.
          service.destinyInerface.listBungieGroupsJoined(user.bungieMemberShipId, user.psnId,1, callback)
        }else callback({error:"User doesnot exist/logged in."})
      },function(groups,callback){
        if(groups) {
          groupList = groups
          service.eventService.listEventCountByGroups(utils._.map(groups, 'groupId'), callback)
        }else return callback(null, null)
      },function(eventCounts, callback){
        mergeEventStatsWithGroups(eventCounts,groupList, callback)
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
  if(eventCountList){
    //groupList = {groupList:groupList,eventStats:eventCounts}
    groupUpdatedList = utils._.map(JSON.parse(JSON.stringify(groupList)),function(group){
      var eventCount = utils._.find(eventCountList,{"_id":group.groupId})
      if(eventCount) group.eventCount=eventCount.count
      return group
    })
  }

  return callback(null, groupUpdatedList)
}

/** Routes */
routeUtils.rGet(router, '/group/list', 'listMyGroups', listMyGroups)
routeUtils.rGet(router, '/group/search/:groupId', 'searchGroupById', searchGroupReq)
module.exports = router

