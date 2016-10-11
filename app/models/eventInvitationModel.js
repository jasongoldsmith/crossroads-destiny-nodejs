var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')

// Activity Schema
var eventInvitationSchema = require('./schema/eventInvitationSchema')

// Model initialization
var EventInvitation = mongoose.model('EventInvitation', eventInvitationSchema.schema)

function getByQueryPopulated(query, callback) {
  EventInvitation
    .find(query)
    .populate("event")
    .populate("invitor", "-passWord")
    .populate("invitee", "-passWord")
    .batchSize(50)
    .exec(function (err, eventInvitationList) {
      if(err) {
        utils.l.s("There was a problem in getting EventInvitation populated from db", err)
        return callback({error: "There was some problem in sending the invite. Please try again later."}, null)
      } else {
        return (err, eventInvitationList)
      }
    })
}

function getByQueryLean(query, callback) {
  EventInvitation
    .find(query)
    .batchSize(50)
    .exec(function (err, eventInvitationList) {
      if(err) {
        utils.l.s("There was a problem in getting EventInvitation populated from db", err)
        return callback({error: "There was some problem in sending the invite. Please try again later."}, null)
      } else {
        return (err, eventInvitationList)
      }
    })
}

function create(data, callback) {
  var eventInvitationObj = new EventInvitation(data)
  utils.async.waterfall([
    function (callback) {
      var query1 = {
        event: data.eventId,
        invitor: data.invitorId,
        invitee: data.inviteeId
      }
      var query2 = {
        event: data.eventId,
        invitor: data.inviteeId,
        invitee: data.invitorId
      }
      getByQueryLean({$or: [query1, query2]}, callback)
    },
    function(eventInvitation, callback) {
      if(eventInvitation) {
        utils.l.d("Invitation already exists for this event, skipping creation", eventInvitation)
        return callback({error: "The invitation already exists for this event"}, null)
      } else {
        save(eventInvitationObj, callback)
      }
    }
  ], callback)
}

function save(eventInvitationObj, callback) {
  eventInvitationObj.save(function(err, result) {
    if(err) {
      utils.l.s("There was a problem in saving the eventInvitation object", err)
      return callback({error: "There was some problem in sending the invite. Please try again later."}, null)
    } else {
      return callback(err, result)
    }
  })
}

function removeEventInvitation(eventInvitation, callback) {
  eventInvitation.remove(callback)
}

module.exports = {
  model: EventInvitation,
  create: create,
  delete: removeEventInvitation
}