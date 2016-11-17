var express = require('express')
var router = express.Router()
var config = require('config')
var utils = require('../../../utils')
var helpers = require('../../../helpers')
var routeUtils = require('../../routeUtils')
var models = require('../../../models')
var service = require('../../../service/index')

function listMyGroups(req, res) {
  listGroups(req.user, function(err, groups) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      groupsResponse = groups || [{}]
      routeUtils.handleAPISuccess(req, res, groupsResponse)
    }
  })
}

function updateHelmet(req, res) {
  service.accountService.handlUpdateHelmet(req.user, function(err, updateResponse) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, updateResponse)
    }
  })
}


function listGroups(user, callback) {
  var groupList = null
  var userObj = null
  utils.async.waterfall([
    function (callback) {
      models.user.getUserById({id: user._id}, callback)
    },function(user,callback){
      if(user){
        userObj = user
        models.userGroup.getByUser(user._id,callback)
      }
      else return callback({error: "User doesnot exist/logged in."})
    },
    function(userGroup,callback) {
      listUserGroups(userGroup,user,callback)
    },
    function(groups, callback) {
      if(groups) {
        groupList = groups
        groupList.push(utils.constants.freelanceBungieGroup)
        models.user.updateUser(mergeGroups(userObj, groupList), false, function(err, user) {
          addMuteFlagToGroupObject(user, groupList)

          if (user) {
            service.eventService.listEventCountByGroups(utils._.map(groupList, 'groupId'),
              utils.primaryConsole(userObj).consoleType, callback)
          } else {
            return callback(err, null)
          }
        })
      } else {
        return callback(null, null)
      }
    },
    function(eventCounts, callback) {
      mergeEventStatsWithGroups(eventCounts,groupList, callback)
    },
    function(groupEventStatsList,callback) {
      groupList = groupEventStatsList
      service.authService.listMemberCountByClan(utils._.map(groupList, 'groupId'),
      utils.primaryConsole(userObj).consoleType, callback)
    },
    function(memberCounts, callback) {
      mergeMemberStatsWithGroups(memberCounts, groupList, callback)
    }
  ], callback)
}

function listUserGroups(userGroup,user,callback){
  utils.async.waterfall([
    function(callback) {
      var groupsObj = (userGroup && userGroup.groups) ? userGroup.groups : []
      var dateUpdated = userGroup ? utils.moment(userGroup.uDate).utc().add("24","hours") : utils.moment().utc()
      utils.l.d("dateUpdated",dateUpdated)
      if (groupsObj.length>0 && dateUpdated >= utils.moment().utc()) {
        utils.l.d("Groups already exists.")
        callback (null,userGroup)
      } else {
        utils.l.d("Groups does not exists. Fetching from bungie")
        service.destinyInerface.listBungieGroupsJoined(user.bungieMemberShipId, utils.primaryConsole(user).consoleType, 1, function(err, groups){
          if(groups)
            models.userGroup.updateUserGroup(user._id,groups,callback)
          else callback(err,userGroup)
        })
      }
    },function(updatedUserGroup, callback){
      callback(null,(updatedUserGroup && updatedUserGroup.groups) ? updatedUserGroup.groups : [])
    }
  ],callback)
}

function resendBungieMessage(req, res) {
  handleResendBungieMessage(req.user, function(err, user) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, user)
    }
  })
}

function handleResendBungieMessage(userData,callback){
  utils.async.waterfall([
    function(callback) {
      //TBD: membershiptype is hardcoded to PSN for now. When we introduce multiple channels change this to take it from userdata
      // or send notification to both xbox and psn depending on the ID availability
      if(utils.config.enableBungieIntegration) {
        var primaryConsole = utils.primaryConsole(userData)
        service.destinyInerface.sendBungieMessage(userData.bungieMemberShipId,
          utils._.get(utils.constants.consoleGenericsId, primaryConsole.consoleType),
          utils.constants.bungieMessageTypes.accountVerification, function (error, messageResponse) {

            utils.l.d('handleResendBungieMessage::messageResponse', messageResponse)
            utils.l.d('handleResendBungieMessage::signupUser::sendBungieMessage::error', error)
            if (messageResponse) {
              utils.l.d("messageResponse::token===" + messageResponse.token)
              primaryConsole.verifyStatus = "INITIATED"
              primaryConsole.verifyToken = messageResponse.token
              var newUserObj = {
                id: userData._id,
                consoles: userData.consoles
              }
              return callback(null, newUserObj)
            } else {
              return callback(error, null)
            }
          })
        } else {
          console.log("Destiny validation disabled")
          return callback(null, null)
        }
      },
    function (newUser, callback) {
      if(newUser) {
        // don't send message
        models.user.updateUser(newUser, false, callback)
      } else {
        callback(null, userData)
      }
    }
  ], callback)
}

function searchGroupReq(req, res) {
  searchGroup(req.user, req.param('groupId'),function(err, groups) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, groups)
    }
  })
}

function searchGroup(user, groupId, callback){
  var userObj = null
  var groupList = null
  utils.async.waterfall([
    function (callback) {
      models.user.getUserById({id: user._id}, callback)
    },
    function (user, callback) {
      if(user) {
        userObj = user
        //TODO: set current page to 1 for now. Change it when we have paging for groups.
        service.destinyInerface.listBungieGroupsJoined(user.bungieMemberShipId,
          utils.primaryConsole(userObj).consoleType,1, callback)
      } else {
        return callback({error: "User does not exist/logged in."}, null)
      }
    },
    function (groups, callback) {
      if (groups) {
        groupList = groups
        groupList.push(utils.constants.freelanceBungieGroup)

        addMuteFlagToGroupObject(userObj, groupList)
        service.eventService.listEventCountByGroups(utils._.map(groups, 'groupId'),
          utils.primaryConsole(userObj).consoleType, callback)
      } else {
        return callback({error: "You do not belong to this group anymore"}, null)
      }
    },
    function (eventCounts, callback) {
        mergeEventStatsWithGroups(eventCounts, groupList, callback)
      }
    ],
    function (err, bungieGroups) {
      if (err) {
        return callback (err, null)
      } else {
        utils.l.d("Groups::" + JSON.stringify(bungieGroups))
        var group = utils._.head(utils._.filter(bungieGroups, {groupId: groupId}))
        if(utils._.isInvalidOrBlank(group)) {
          return callback({error: "You do not belong to this group anymore"}, null)
        } else {
          return callback(null, group)
        }
      }
    }
  )
}

function muteGroupNotifications(req, res) {
  utils.l.d("mute group notification request" + JSON.stringify(req.body))
  handleMuteGroupNotifications(req.user, req.body, function(err, group) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, group)
    }
  })
}

function handleMuteGroupNotifications(user, data, callback) {
  utils.async.waterfall([
    function(callback) {
      models.user.getById(user._id, callback)
    },
    function (userObj, callback) {
      muteGroup(userObj, data, callback)
    },
    function(updatedUser, callback) {
      models.user.save(updatedUser, function(err, user) {
        if(err) {
          return callback(err, null)
        } else {
          return callback(null, data)
        }
      })
    },
    //TODO: not tested yet, uncomment after testing
    //function(userDB, callback) {
    //  helpers.sns.unsubscribeAllEndpoints(userDB, true, callback)
    //}
  ], callback)
}

function muteGroup(user, data, callback) {
  var userGroup = utils._.find(user.groups, {groupId: data.groupId})
  if(utils._.isInvalidOrBlank(userGroup)) {
    return callback({error: "You do not belong to this group anymore"}, null)
  }

  utils._.map(user.groups, function(group) {
    if(group.groupId.toString() == data.groupId.toString()) {
      if(data.muteNotification === "true" || data.muteNotification == true) {
        group.muteNotification = true
      }else {
        group.muteNotification = false
      }
    }
  })

  return callback(null, user)
}
function mergeEventStatsWithGroups(eventCountList, groupList, callback){
  var groupUpdatedList = null
  if (eventCountList) {
    groupUpdatedList = utils._.map(JSON.parse(JSON.stringify(groupList)), function(group) {
      var eventCount = utils._.find(eventCountList, {"_id": group.groupId})
      if (eventCount) {
        group.eventCount = eventCount.count
      }
      return group
    })
  } else {
    groupUpdatedList = groupList
  }
  return callback(null, groupUpdatedList)
}

function mergeMemberStatsWithGroups(memberCounts, groupList, callback) {
  var groupUpdatedList = null
  if(memberCounts) {
    groupUpdatedList = utils._.map(JSON.parse(JSON.stringify(groupList)), function(group) {
      var userCount = utils._.find(memberCounts, {"_id": group.groupId})
      if (userCount) {
        group.memberCount = userCount.count
      }
      return group
    })
  } else {
    groupUpdatedList = groupList
  }
  return callback(null, groupUpdatedList)
}

function mergeGroups(user, bungieGroups) {
  var bungieGroupIds = utils._.map(bungieGroups, 'groupId')
  var updatedGroups = utils._.map(bungieGroupIds,function(bungieId) {
    var userGroup = utils._.find(user.groups, {groupId: bungieId})
    if(!userGroup) {
      return {
        groupId: bungieId,
        muteNotification: false
      }
    } else {
      return userGroup
    }
  })

  return {
    id: user._id,
    groups: updatedGroups
  }
}

function addMuteFlagToGroupObject(user, groupsList) {
  if(utils._.isValidNonBlank(user)) {
    utils._.map(groupsList, function(group) {
      var userGroup = utils._.find(user.groups, {"groupId": group.groupId})
      group.muteNotification = userGroup.muteNotification
    })
  }
}

function refreshHelmet(req, res) {
  service.accountService.refreshHelmentAndConsoles(req.user, function(err, updateResponse) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, updateResponse)
    }
  })
}

/** Routes */
routeUtils.rGet(router, '/group/list', 'listMyGroups', listMyGroups)
routeUtils.rGet(router, '/group/search/:groupId', 'searchGroupById', searchGroupReq)
routeUtils.rGet(router, '/group/resendBungieMessage', 'resendBungieMessage', resendBungieMessage)
routeUtils.rPost(router, '/group/mute', 'muteGroupNotification', muteGroupNotifications)
routeUtils.rPost(router, '/updateHelmet', 'updateHelmet', updateHelmet)
routeUtils.rPost(router, '/refreshHelmet', 'updateHelmet', refreshHelmet)
module.exports = router

