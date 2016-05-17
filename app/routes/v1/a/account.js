var express = require('express')
var router = express.Router()
var config = require('config')
var utils = require('../../../utils')
var helpers = require('../../../helpers')
var routeUtils = require('../../routeUtils')
var models = require('../../../models')
var service = require('../../../service/index')

function listMyGroups(req,res){
  var user = req.body.psnId
  console.log("listMyGroups::"+user)
  listGroups(req.user, function(err, groups) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, groups)
    }
  })
}

function listGroups(user,callback){
  utils.async.waterfall([
      function (callback) {
        models.user.getUserById({id:user._id},callback)
      },
      function(user,callback){
        if(user) {
          //TODO: set current page to 1 for now. Change it when we have paging for groups.
          service.destinyInerface.listBungieGroupsJoined(user.bungieMemberShipId, user.psnId,1, callback)
        }else callback({error:"User doesnot exist/logged in."})
      }
    ],
  callback
  )
}


/** Routes */
routeUtils.rGet(router, '/group/list', 'listMyGroups', listMyGroups, listMyGroups)
module.exports = router

