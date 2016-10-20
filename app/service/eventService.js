var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')
var eventNotificationTriggerService = require('./eventNotificationTriggerService')
var reportService = require('./reportService')
var destinyInterface = require('./destinyInterface')
var authService = require('./authService')
var eventInvitationService = require('./eventInvitationService')

function clearEventsForPlayer(user, launchStatus, consoleType, callback){

  utils.async.waterfall([
    function(callback){
      models.event.getByQuery(getEventsByPlayerQuery(user._id.toString(), consoleType, launchStatus), null, callback)
    },
    function(eventList, callback) {
      //mapSeries used to avoid the consurrency situation in the same session.
      utils.async.mapSeries(eventList, function(event, callback) {
        handleLeaveEvent(user, {eId: event._id.toString()}, true, callback)
      }, callback)
    }
  ], callback)
}


function createEvent(user, data, callback) {
  utils.async.waterfall([
    function(callback) {
      models.event.createEvent(user, data, callback)
    },
    function(event, callback) {
      if(utils._.isInvalid(event)) {
        return callback(null, null)
      }
      if(event.players.length == 1) {
        models.notificationQueue.addToQueue(event._id, null, "newCreate")
        updateUserStats(user, "eventsCreated")
      } else {
        addPushNotificationToQueue(event, utils.getNotificationPlayerListForEventExceptUser(user, event), user, null, "join")
        updateUserStats(user, "eventsJoined")
        updateUserStatsForFullEvent(event)
      }
      handleCreatorChangeForFullCurrentEvent(event, callback)
    }
  ], callback)
}

function joinEvent(user, data, callback) {
  utils.async.waterfall([
    function(callback) {
      models.event.joinEvent(user, data, callback)
    },
    function(event, callback) {
      if(utils._.isInvalid(event)) {
        return callback(null, null)
      }
      addPushNotificationToQueue(event, utils.getNotificationPlayerListForEventExceptUser(user, event), user, null, "join")
      updateUserStats(user, "eventsJoined")
      updateUserStatsForFullEvent(event)
      handleCreatorChangeForFullCurrentEvent(event, callback)
    }
  ], callback)
}

function leaveEvent(user, data, callback) {
  handleLeaveEvent(user, data, false, callback)
}

function handleLeaveEvent(user, data, userTimeout, callback) {
  utils.l.d('handleLeaveEvent::', data)
  utils.async.waterfall([
    function(callback) {
      models.event.leaveEvent(user, data, callback)
    },
    function(event, callback) {
      if(!userTimeout && utils._.isValidNonBlank(event) && !event.deleted) {
        addPushNotificationToQueue(event, [user], user, null, "leave")
        removeInvitedPlayersFromEvent(user, event, callback)
      } else {
        return callback(null, event)
      }
    }
  ],
    function (err, event) {
      if(err) {
        return callback(err, event)
      }
      updateUserStats(user, "eventsLeft")
      updateEventsFirebase(user, userTimeout, event)
      helpers.m.incrementEventsLeft(user)
      return callback(err, event)
  })
}

function removeInvitedPlayersFromEvent(user, event, callback) {
  utils.async.waterfall([
    function (callback) {
      models.eventInvitation.getByQueryPopulated({event: event._id, inviter: user._id}, callback)
    },
    function (eventInvitationList, callback) {
      if(utils._.isInvalidOrBlank(eventInvitationList)) {
        return callback(null, event)
      }
      // Need to remove the entry if the person leaving is an invitee
      service.eventInvitationService.findOneAndRemove({invitee: user._id}, function (err, deletedEventInvitation) {
        if(err) {
          utils.l.s("Event invitation could not be deleted")
        }
      })

      utils.async.mapSeries(eventInvitationList, function(eventInvitation, callback) {
        eventInvitationService.deleteInvitation(eventInvitation, function (err, deletedEventInvitation) {
          if(err) {
            utils.l.s("Event invitation could not be deleted")
          }
        })
        models.event.leaveEvent(eventInvitation.invitee, {eId: event._id.toString()}, callback)
      }, utils.firstInArrayCallback(callback))
    }
  ], callback)
}

function updateEventsFirebase(user, userTimeout, event) {
  if(utils._.isValidNonBlank(event) && event.deleted) {
    // When the event has been deleted we want to make all fields null in firebase
    helpers.firebase.createEventV2({_id : data.eId, clanId: event.clanId}, user, userTimeout)
  } else {
    helpers.firebase.updateEventV2(event, user, userTimeout)
  }
}

function listEventCountByGroups(groupIds, consoleType, callback){
  models.event.listEventCount("clanId", {clanId: {$in: groupIds}, consoleType: consoleType}, callback)
}

function expireEvents(notifTrigger,sysConfig){
  utils.l.d("Starting expireEvents")
  utils.async.waterfall([
    function (callback) {
      var eventExpiryInterval = sysConfig.value || utils.config.eventExpiryInterval
      utils.l.d('looking for events inactive for ' + eventExpiryInterval + " mins")
      var date = utils.moment().utc().add(eventExpiryInterval, "minutes")
      models.event.getEventsByQuery({
        launchStatus: utils.constants.eventLaunchStatusList.now,
        updated: {$lte: date}
      }, callback)
    },
    function(events, callback) {
      var totalEventsToExpire = events ? events.length: 0
      if(totalEventsToExpire > 0) {
        utils.async.map(events, function(event, asyncCallback) {
          archiveEvent(event, notifTrigger, asyncCallback)
        }, callback)
      } else {
        return callback(null, null)
      }
    }
  ],
    function (err, updatedEvents) {
      if (err) {
        utils.l.s("Error sending expireEvents notification::" + JSON.stringify(err))
      }
      utils.l.i("Completed trigger expireEvents::" + utils.moment().utc().format())
    }
  )
}

function archiveEvent(event,notifTrigger,callback){
  utils.async.waterfall([
    function(callback) {
      models.archiveEvent.createArchiveEvent(event, function(err, data) {})
      models.event.removeEvent(event, callback)
    }
  ],
    function(err, eventRemoveStatus) {
      utils.l.d('eventRemoved',utils.l.eventLog(eventRemoveStatus))
      if(!err) {
        event.deleted = true
        if(notifTrigger.isActive && notifTrigger.notifications.length > 0) {
          utils.async.map(notifTrigger.notifications,
            utils._.partial(eventNotificationTriggerService.createNotificationAndSend, event, null, null))
        }
        helpers.firebase.createEventV2({_id: event._id, clanId: event.clanId}, null, true)
        return callback(null, event)
      } else {
        return callback({error: "Error removing event.id" + event._id}, null)
      }
  })
}

function addComment(user, data, callback) {
  utils.async.waterfall([
    function(callback) {
      models.event.getById(data.eId, callback)
    },
    function(event, callback) {
      if(utils._.isInvalidOrBlank(event)) {
        utils.l.i("No such event found", event)
       return callback({error: "This event does has been deleted"}, null)
      }
      var comment = {
        user: user._id,
        text: data.text,
      }
      event.comments.push(comment)
      models.event.updateEvent(event, function(err, updatedEvent) {
        if(err) {
          utils.l.s("There was a problem in adding the comment to the database", err)
          return callback({error: "There was some problem in adding the comment"}, null)
        } else {
          return callback(null, updatedEvent)
        }
      })
    }
  ],
    function(err, event) {
      if(err) {
        return callback(err, null)
      } else {
        utils.l.d("comment was added successfully to event", data.text)
        utils.l.eventLog(event)
        addPushNotificationToQueue(event, utils.getNotificationPlayerListForEventExceptUser(user, event), null,
          createCommentTextForPush(user, event, data.text), "addComment")

        if(!utils.config.disableEnvetUpdateForComments) {
          helpers.firebase.updateEventV2(event, user, true)
        }
        helpers.firebase.updateComment(event)
        return callback(null, event)
      }
    })
}

function reportComment(user, data, callback) {
  utils.async.waterfall([
    function(callback) {
      models.event.getById(data.eId, callback)
    },
    function(event, callback) {
      if(!event) {
        return callback({error: "This event has been deleted. Please refresh"}, null)
      }

      if(data.formDetails) {
        createReport(user, data, data.formDetails, function (err, report) {
          if(err) {
            utils.l.s("There was a problem is creating a report", err)
            return callback(null, event, false)
          } else {
            utils.l.d("Report was created successfully for this comment", data.formDetails)
            return callback(null, event, true)
          }
        })
      } else {
        utils.l.d("No formDetails field found")
        return callback(null, event, false)
      }
    },
    function(event, isFormFilled, callback){
      handleUserCommentReports(user, event, isFormFilled, callback)
    },
    function(event, callback) {
      var commentObj = utils._.find(event.comments, function(comment) {
        return comment._id.toString() == data.commentId.toString()
      })

      if(utils._.isInvalidOrBlank(commentObj)) {
        return callback({error: "This comment has been deleted. Please refresh"}, null)
      } else {
        commentObj.isReported = true
        models.event.updateEvent(event, callback)
      }
    }
  ],
    function (err, event) {
      if(err) {
        return callback(err, null)
      } else {
        utils.l.d("comment was successfully reported", data.text)
        utils.l.eventLog(event)
        if(!utils.config.disableEnvetUpdateForComments)
          helpers.firebase.updateEventV2(event, user, true)
        helpers.firebase.updateComment(event)
        return callback(null, event)
      }
    })
}

function handleUserCommentReports(user, event, isFormFilled, callback) {
  utils.async.waterfall([
    function(callback) {
      var keys = [
        utils.constants.sysConfigKeys.commentsReportMaxValue,
        utils.constants.sysConfigKeys.commentsReportCoolingOffPeriod
      ]
      models.sysConfig.getSysConfigList(keys, callback)
    },
    function(commentsReportFrequency, callback) {
      if(utils._.isInvalidOrBlank(commentsReportFrequency)) {
        utils.l.d("report misuse values not found in the database")
        return callback({error: "There was a problem in reporting the comment"}, null)
      }

      var maxAllowedComments = utils._.find(commentsReportFrequency, function (value) {
        return value.key.toString() == utils.constants.sysConfigKeys.commentsReportMaxValue.toString()
      })

      if(isFormFilled) {
        user.commentsReported = 1
        user.hasReachedMaxReportedComments = false
      } else if(user.commentsReported < parseInt(maxAllowedComments.value)) {
        user.commentsReported++
        user.hasReachedMaxReportedComments = false
      } else {
        var lastCommentReportedTime = utils.moment(user.lastCommentReportedTime).utc()
        var currentTIme = utils.moment().utc()
        var timeDiff = currentTIme.diff(lastCommentReportedTime, 'minutes')

        var coolingOffPeriod = utils._.find(commentsReportFrequency, function (value) {
          return value.key.toString() == utils.constants.sysConfigKeys.commentsReportCoolingOffPeriod.toString()
        })
        utils.l.d('1111*********lastCommentReportedTime::'+lastCommentReportedTime+"::currentTIme::"+currentTIme+"::timeDiff::"+timeDiff+"::coolingOffPeriod::"+coolingOffPeriod)
        if(timeDiff > parseInt(coolingOffPeriod.value)) {
          utils.l.d('2222*********lastCommentReportedTime::'+lastCommentReportedTime+"::currentTIme::"+currentTIme+"::timeDiff::"+timeDiff+"::coolingOffPeriod::"+coolingOffPeriod)
          user.commentsReported = 1
          user.hasReachedMaxReportedComments = false
        } else {
          utils.l.d('3333*********lastCommentReportedTime::'+lastCommentReportedTime+"::currentTIme::"+currentTIme+"::timeDiff::"+timeDiff+"::coolingOffPeriod::"+coolingOffPeriod)
          user.commentsReported++
          user.hasReachedMaxReportedComments = true
        }
      }

      user.lastCommentReportedTime = Date.now()
      models.user.save(user, function(err, user) {
        if(err) {
          utils.l.d("There was a problem in saving the user", user)
          return callback({error: "There was a problem in reporting the comment"}, null)
        } else {
          utils.l.d("last reported comment was successfully updated on user")
          utils.l.userLog(user)
        }
        helpers.firebase.updateUser(user)
        return callback(null, event)
      })
    }
  ], callback)
}

function createReport(user, data, formDetails, callback) {
  var reportDetails = {
    reporter: user._id,
    reporterEmail: formDetails.reporterEmail,
    reportDetails: formDetails.reportDetails,
    reportAdditionalInfo: {
      eId: data.eId,
      commentId: data.commentId
    }
  }
  reportService.createReport(reportDetails, callback)
}

function createCommentTextForPush(user, event, comment) {
  return utils.consoleByType(user, event.consoleType).consoleId + ": " + comment
}

function getEventsByPlayerQuery(playerId,consoleType,launchStatus){
  var query = {players: playerId}
  if(consoleType)
    query.consoleType = consoleType
  if(launchStatus)
    query.launchStatus = launchStatus
  return query
}

function updateUserStatsForFullEvent(event) {
  if(event.status.toString() == "full") {
    utils.async.mapSeries(event.players, function(player, callback) {
      models.user.getById(player._id.toString(), function (err, user) {
        updateUserStats(user, "eventsFull")
        helpers.m.incrementEventsFull(user)
        helpers.m.trackRequest("eventFull", {"distinct_id":user._id,eventId:event._id}, null, user)
        return callback(null, user)
      })
    },
    function (err, updatedUsers) {
      if(err) {
        utils.l.s("Error in updating user full event stats", err)
      } else {
        utils.l.d("Users were updated successfully", updatedUsers)
        utils.l.userLog(updatedUsers)
      }
    })
  }
}

function updateUserStats(user, eventAction) {
  user.stats[eventAction] = ++user.stats[eventAction]
  models.user.save(user, function (err, updatedUser) {
    if(err) {
      utils.l.s("Error in updating user stats", err)
    } else {
      utils.l.d("User was updated successfully")
      utils.l.userLog(updatedUser)
    }
  })
}

function clearCommentsByUser(user,callback){
  models.event.clearCommentsByUser(user,callback)
}

function publishFullEventListing(event,req){

  if(utils._.isValidNonBlank(req.user) &&
    utils._.findIndex(event.players,{"_id":req.user._id}) >=0
    && event.status.toString() == "full"){
    helpers.m.trackRequest("viewFullEvent", {"distinct_id":req.user.id,eventId:event._id}, req, req.user)
  }
}

function handleDuplicateCurrentEvent(event, callback) {
  utils.async.waterfall([
    function(callback) {
      utils.l.d("Looking for duplicate events", event)
      models.event.getById(event._id, callback)
    },
    function(queriedEvent, callback) {
      if(!queriedEvent) {
        utils.l.d("This event was deleted: " + event._id)
        return callback(null, null)
      }
      var query = {
        _id: {$nin: [event._id]},
        eType: event.eType,
        clanId: event.clanId,
        consoleType: event.consoleType,
        launchStatus: utils.constants.eventLaunchStatusList.now
      }
      models.event.getByQueryLeanWithComments(query, callback)
    },
    function(currentEventList, callback) {
      utils.l.i("currentEventList", currentEventList)
      if(!currentEventList) {
        return callback(null, event)
      }
      utils.async.mapSeries(currentEventList, function (currentEvent, callback) {

          var playerList = utils.getUniquePlayerListOfTwoEvents(event, currentEvent)
          utils.l.i("getUniquePlayerListOfTwoEvents", playerList)
          if(playerList.length <= event.maxPlayers) {
            event.players = playerList
            // We need to convert the user MongooseId Object to string for this to work
            utils._.forEach(currentEvent.comments, function (comment) {
              comment.user = comment.user.toString()
              event.comments.push(comment)
            })
            
            models.event.update(event, function(err, updatedEvent) {
              if(err) {
                utils.l.s("Merging:: Error in updating event", err)
                return callback(null, event)
              } else {
                utils.l.d("Merging:: Events were merged successfully: " + updatedEvent._id.toString() + ", " + currentEvent._id.toString())
                models.event.deleteEvent({eId: currentEvent._id}, function(err, eventDeleted) {
                  if(err) {
                    utils.l.s("Merging:: Error in removing event", err)
                    return callback(null, event)
                  } else {
                    utils.l.d("Merging:: Event was deleted successfully", eventDeleted)
                    return callback(null, event)
                  }
                })
              }
            })
          } else {
            return callback(null, event)
          }
        },
        function (err, eventList) {
          if(err) {
            return callback(err, null)
          } else {
            return callback(null, eventList)
          }
        })
    }
  ], callback)
}

function listEventById(data, callback) {
  utils.async.waterfall([
    function (callback) {
      models.event.getById(data.id, callback)
    },
    function (event, callback) {
      if(utils._.isInvalidOrBlank(event)){
        return callback({ error: "Sorry, looks like that event is no longer available."},null)
      }
      addIsActiveFlagToEventPlayers(event, callback)
    },
    function (eventObj, callback) {
      groupByInvited(eventObj, callback)
    }
  ], callback)

}

function handleCreatorChangeForFullCurrentEvent(event, callback) {
  if(event.status == "full" && event.launchStatus == "now") {
    utils.async.waterfall([
      function (callback) {
        addIsActiveFlagToEventPlayers(event, callback)
      },
      function (eventObj, callback) {
        addIsInvitedByToPlayers(eventObj, callback)
      },
      function (eventObj, callback) {
        makeFirstActivePlayerTheCreator(event, eventObj, callback)
      }
    ], callback)
  } else {
    utils.l.d("This event does not need a leader yet")
    return callback(null, event)
  }
}

function addIsActiveFlagToEventPlayers(event, callback) {
  getUserActiveTimeout(function(err, userActiveTimeOutInMins) {
    // We need to convert a mongo object to a plain object to add new fields (isActive)
    var eventObj = event.toObject()

    // We need to only add new fields and decide the creator for "full" events
    var activeCutOffTime = utils.moment().subtract(userActiveTimeOutInMins, 'minutes')

    // Decide isActive for creator
    if(eventObj.creator.lastActiveTime < activeCutOffTime) {
      eventObj.creator.isActive = false
    } else {
      eventObj.creator.isActive = true
    }

    // Decide isActive for event players
    utils._.forEach(eventObj.players, function(player) {
      if(player.lastActiveTime < activeCutOffTime) {
        player.isActive = false
      } else {
        player.isActive = true
      }
    })

    return callback(null, eventObj)
  })
}

function makeFirstActivePlayerTheCreator(event, eventObj, callback) {
  // active players are also defined as not invited players
  var activePlayers = utils._.remove(eventObj.players, {isActive: true, invitedBy: null})

  // If creator is inactive and someone in the event is active then change creator
  if(!eventObj.creator.isActive && utils._.isValidNonBlank(activePlayers)) {
    event.creator = activePlayers[0]._id
    // We need to realign the players list based on the new creator
    event.players = []
    utils._.forEach(activePlayers, function(player) {
      event.players.push(player._id)
    })
    utils._.forEach(eventObj.players, function(player) {
      event.players.push(player._id)
    })

    models.event.update(event, function (err, updatedEvent) {
      if(err || !updatedEvent) {
        utils.l.s("There was a problem in updating the event", err)
        return callback(null, event)
      } else {
        // Send a push notification if the creator changes
        models.notificationQueue.addToQueue(event._id, null, "creatorChange")
        return callback(null, updatedEvent)
      }
    })
  } else {
    return callback(null, event)
  }
}

function groupByInvited(eventObj, callback) {
  utils.async.waterfall([
    function (callback) {
      addIsInvitedByToPlayers(eventObj, callback)
    },
    function (eventObj, callback) {
      var invitedPlayerList = utils._.remove(eventObj.players, function (player) {
        return player.invitedBy != null
      })

      utils._.forEach(invitedPlayerList, function(invitedPlayer) {
        var index = utils._.findIndex(eventObj.players, function(player) {
          return player._id.toString() == invitedPlayer.invitedBy
        })
        eventObj.players.splice(index + 1, 0, invitedPlayer)
      })
      return callback(null, eventObj)
    }
  ], callback)
}

function addIsInvitedByToPlayers(eventObj, callback) {
  utils.async.waterfall([
    function (callback) {
      models.eventInvitation.getByQueryLean({event: eventObj._id}, callback)
    },
    function (eventInvitationList, callback) {
      if(utils._.isInvalidOrBlank(eventInvitationList)) {
        utils.l.d("There are no invitations for this event", eventObj._id)
        return callback(null, eventObj)
      }
      utils._.map(eventObj.players, function (player) {
        var playerInvitationObj = utils._.find(eventInvitationList, function(eventInvitation) {
          return eventInvitation.invitee.toString() == player._id.toString()
        })
        player.invitedBy = playerInvitationObj ? playerInvitationObj.inviter.toString() : null
      })
      return callback(null, eventObj)
    }
  ], callback)
}

function getUserActiveTimeout(callback) {
  var defaultUserActiveTimeOutInMins = 10
  models.sysConfig.getSysConfig(utils.constants.sysConfigKeys.userActiveTimeOutInMins, function (err, userActiveTimeOutInMins) {
    if(err || !userActiveTimeOutInMins) {
      utils.l.s("There was a problem in getting userActiveTimeInMins from sysconfig table", err)
      return callback(null, defaultUserActiveTimeOutInMins)
    } else {
      utils.l.d("Got userActiveTimeOutInMins from db", userActiveTimeOutInMins.value)
      return callback(null, userActiveTimeOutInMins.value)
    }
  })
}

function addUsersToEvent(event, userIds, callback) {
  utils._.map(userIds, function(userId) {
    event.players.push(userId)
  })
  if(event.players.length > event.maxPlayers) {
    return callback({error: "Sorry looks like you can't add these many players to this event"}, null)
  }
  models.event.update(event, callback)
}

function invite(user, data, callback) {
  var eventObj
  utils.async.waterfall([
    function (callback) {
      models.event.getById(data.eId, callback)
    },
    function(event, callback) {
      if(!event) {
        utils.l.d("No event was found for sending invite")
        return callback({error: "This event has been deleted. Please refresh"}, null)
      }
      eventObj = event
      validateInvitees(data, event, callback)
    },
    function(validatedInvitees, callback) {
      handleUserInvites(eventObj, user, validatedInvitees.invitees, validatedInvitees.invitationLink, callback)
    },
  ], callback)
}

function validateInvitees(data, event, callback) {
  var updatedInvitees = []
  utils._.map(data.invitees,function(invitedUserGamerTag){
    utils.l.d('utils._.includes(updatedInvitees,invitedUserGamerTag)::', utils._.includes(updatedInvitees, invitedUserGamerTag))
    utils.l.d("utils._.find(utils._.flatten(utils._.map(event.players,'consoles')),{consoleId:invitedUserGamerTag}))",
      utils._.find(utils._.flatten(utils._.map(event.players, 'consoles')), {consoleId: invitedUserGamerTag}))
    if(!utils._.hasElement(updatedInvitees,invitedUserGamerTag) &&
      !utils._.hasElement(utils._.map(utils._.flatten(utils._.map(event.players, 'consoles')), 'consoleId'), invitedUserGamerTag)) {
      updatedInvitees.push(invitedUserGamerTag)
    }
  })
  if(utils._.isValidNonBlank(updatedInvitees)) {
    data.invitees = updatedInvitees
    utils.l.d('updatedInvitees::', updatedInvitees)
    return callback(null, data)
  } else {
    return callback({error: "All invitied players are already part of this event", errorType:"NO_NEW_INVITEES"}, null)
  }
}

function handleUserInvites(event, inviter, inviteesGamertags, invitationLink, callback) {
  // Due to circular dependency between eventService, authService and userService maybe the authService gets loaded partially
  // and authService methods are not loaded without this call
  authService = require('./authService')
  var messageDetails = {
    event: event,
    invitedByGamerTag: utils.primaryConsole(inviter).consoleId,
    invitationLink: invitationLink
  }
  var invitedUserIds = []
  var userIdsInDatabase = []

  utils.async.waterfall([
    function(callback) {
      models.user.getByQuery({'consoles.consoleId': {$in: inviteesGamertags}}, callback)
    },
    function(usersInDatabase, callback) {
      return handleInvitesForUsersInDatabase(event, usersInDatabase, inviter, messageDetails, invitedUserIds, userIdsInDatabase, callback)
    },
    function(usersInDatabaseGamerTags, callback) {
      var inviteesGamertagsNotInDatabase = utils._.difference(inviteesGamertags, usersInDatabaseGamerTags)
      authService.createInvitees(inviteesGamertagsNotInDatabase, utils.primaryConsole(inviter).consoleType,
        messageDetails, callback)
    }
  ],
    function (err, newUsers) {
      if(err) {
        utils.l.d("Invite was unsucessful", err)
        return callback({error: "Something went wrong with sending invites. Please try again later."}, callback)
      } else {
        utils._.map(newUsers, function(newUser) {
          invitedUserIds.push(newUser._id.toString())
        })
        return callback(null, event, invitedUserIds, userIdsInDatabase)
      }
    })
}

function sendBungieMessage(userList, messageDetails) {
  utils._.map(userList, function (user) {
    var userPrimaryConsole = utils.primaryConsole(user)
    destinyInterface.sendBungieMessageV2(
      user.bungieMemberShipId,
      utils._.get(utils.constants.consoleGenericsId, userPrimaryConsole.consoleType),
      utils.constants.bungieMessageTypes.eventInvitation,
      messageDetails,
      function(err, response) {
        if(err) {
          utils.l.i("There was an error in sending a message to this crossroads user", user)
        } else {
          utils.l.d("Message was sent successfully to this crossroads user", response)
        }
      })
  })
}

function handleInvitesForUsersInDatabase(event, usersInDatabase, inviter, messageDetails, invitedUserIds, userIdsInDatabase, callback) {
// send bungie message and send push notification
  if(utils._.isValidNonBlank(event) && ! event.deleted) {
    addPushNotificationToQueue(event, usersInDatabase, inviter, null, "eventInvite")
    sendBungieMessage(usersInDatabase, messageDetails)
  }

  var usersInDatabaseGamerTags = []
  utils._.map(usersInDatabase, function(user) {
    usersInDatabaseGamerTags.push(utils.primaryConsole(user).consoleId.toString())
    invitedUserIds.push(user._id.toString())
    userIdsInDatabase.push(user._id.toString())
  })
  return callback(null, usersInDatabaseGamerTags)
}

function addPushNotificationToQueue(event, userList, playerJoinedOrLeft, comment, notificationType) {
  var notificationInformation = {
    //userList are players the notification should be sent to
    userList : utils._.isValidNonBlank(userList) ? utils.convertMongooseArrayToPlainArray(userList) : null,
    // playerJoinedorLeft is the player who will replace #PlAYER# in the message template
    playerJoinedOrLeft : playerJoinedOrLeft ? playerJoinedOrLeft.toObject() : null,
    comment: comment
  }
  models.notificationQueue.addToQueue(event._id, notificationInformation, notificationType)
}

module.exports = {
  createEvent: createEvent,
  joinEvent: joinEvent,
  leaveEvent: leaveEvent,
  clearEventsForPlayer: clearEventsForPlayer,
  listEventCountByGroups: listEventCountByGroups,
  expireEvents: expireEvents,
  addComment: addComment,
  reportComment: reportComment,
  clearCommentsByUser: clearCommentsByUser,
  publishFullEventListing: publishFullEventListing,
  handleDuplicateCurrentEvent: handleDuplicateCurrentEvent,
  listEventById: listEventById,
  addUsersToEvent: addUsersToEvent,
  invite: invite,
  handleCreatorChangeForFullCurrentEvent: handleCreatorChangeForFullCurrentEvent
}