var utils = require('../utils')
var Firebase = require("firebase")
var firebaseRef = new Firebase(utils.config.firebaseURL)

var eventsRef = firebaseRef.child("events")
var usersRef = firebaseRef.child("users")

function createEvent(event, user) {

  var clansRef = eventsRef.child(user.clanId)
  var id = event._id.toString()
  var eventObj = null

  // If the event has been deleted it will not have the 'creator' field
  if(event.creator) {
    // We want to remove _id and __v from event as it creates problems while saving in firebase
    eventObj = getEventObj(event)
  }

  clansRef.child(id).set(eventObj, function (error) {
    if (error) {
      utils.l.d("event creation failed in firebase", eventObj)
    } else {
      utils.l.d("event was created successfully in firebase", eventObj)
    }
  })
}

function updateEvent(event, user) {

  var clansRef = eventsRef.child(user.clanId)
  var id = event._id.toString()
  // We want to remove _id and __v from event as it creates problems while saving in firebase
  var eventObj = getEventObj(event)

  clansRef.child(id).update(eventObj, function (error) {
    if (error) {
      utils.l.d("event creation failed in firebase", eventObj)
    } else {
      utils.l.d("event was created successfully in firebase", eventObj)
    }
  })
}

function updateUser(user) {
  //var clansRef = usersRef.child(user.clanId)
  var id = user._id.toString()
  // We want to remove _id and __v from event as it creates problems while saving in firebase
  var userObj = getUserObj(user)
  usersRef.child(id).update(userObj, function (error) {
    if (error) {
      utils.l.d("user creation failed in firebase", user)
    } else {
      utils.l.d("user was created successfully in firebase", user)
    }
  })
}

function createUser(user) {

  //var clansRef = usersRef.child(user.clanId)
  var id = user._id.toString()
  // We want to remove _id and __v from event as it creates problems while saving in firebase
  var userObj = getUserObj(user)
  usersRef.child(id).set(userObj, function (error) {
    if (error) {
      utils.l.d("event creation failed in firebase", user)
    } else {
      utils.l.d("event was created successfully in firebase", user)
    }
  })}

function getEventObj(event) {
  // delete does not work on a mongoose object unless we convert it to a JSON object
  var eventObj = event.toObject()
  delete eventObj._id
  delete eventObj.__v
  return eventObj
}

function getUserObj(user){
  var userObj = user.toObject()
  delete userObj.passWord
  return userObj
}
module.exports = {
  createEvent: createEvent,
  updateEvent: updateEvent,
  updateUser:updateUser,
  createUser:createUser
}