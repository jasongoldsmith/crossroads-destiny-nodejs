var utils = require('../utils')
var Firebase = require("firebase")
var firebaseRef = new Firebase(utils.config.firebaseURL)

var eventsRef = firebaseRef.child("events")

function createEvent(event) {

  var id = event._id.toString()
  var eventObj = null

  // If the event has been deleted it will not have the 'creator' field
  if(event.creator) {
    // We want to remove _id and __v from event as it creates problems while saving in firebase
    eventObj = getEventObj(event)
  }

  eventsRef.child(id).set(eventObj, function (error) {
    if (error) {
      utils.l.d("event creation failed in firebase", eventObj)
    } else {
      utils.l.d("event was created successfully in firebase", eventObj)
    }
  })
}

function updateEvent(event) {

  var id = event._id.toString()
  // We want to remove _id and __v from event as it creates problems while saving in firebase
  var eventObj = getEventObj(event)

  eventsRef.child(id).update(eventObj, function (error) {
    if (error) {
      utils.l.d("event creation failed in firebase", eventObj)
    } else {
      utils.l.d("event was created successfully in firebase", eventObj)
    }
  })
}

function getEventObj(event) {
  // delete does not work on a mongoose object unless we convert it to a JSON object
  var eventObj = event.toObject()
  delete eventObj._id
  delete eventObj.__v
  return eventObj
}

module.exports = {
  createEvent: createEvent,
  updateEvent: updateEvent
}