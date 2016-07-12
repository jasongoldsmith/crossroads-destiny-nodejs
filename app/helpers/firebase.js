var utils = require('../utils')
var Firebase = require("firebase")

Firebase.initializeApp({
  serviceAccount: {
    "project_id": "crossroadsapp-dev",
    "client_email": "local-machine@crossroadsapp-dev.iam.gserviceaccount.com",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEwAIBADANBgkqhkiG9w0BAQEFAASCBKowggSmAgEAAoIBAQCu/CaUmyq5ymnS\noOhifh8XqvfC504DyRMXTXB+4uXUScdqKTSlZrE/ziu2srEJstRo5tPAwERjh/Pm\nmA25eIplWHNsPeQF+/5eC/JhGqXfk+G+DOs2TcL7hBiwJpcoNyFdecmLfak7mvgz\nvVcMWln08jH/ie/eB8N9z2nwICkkFFvhlA+T00HvP0BwaU1yAHcf4/zJh6X7+yF9\nRU0qE/ekgB3INFSG/DTLQYUsziaxJkowx0oH6YGhJkmOrGD2rwZ3Pk7IEgTBLV8j\nmgjW/m9B4eb2ufIv4vZhbY/Zr520IAIy4kpaWpXTSXwRmc2pt9ifzS2U1veJxRp9\nTrJvOf//AgMBAAECggEBAIc1AF6NMstSMsh0WntYNpAkI8Mu1OIp6R11UbpJegq5\nY2ONKUewfL7vgGlv00nKK0RPL0ldhrpdX0FLNjecg1thp/X4MIvLNbXXh1YusAJ8\nks41zz0rgsCzRhw+BUgmqRpAM1IcK7qJuMTJxUwfOCkDR0zLeVNXLl+094d6Yi+k\nXu8xraGklgvQIidSmW3uTXMXuzib/ELOWMgNhm1KlzSB9uKIRRMjzeueDouJE7o0\nWrzqUwd/QYBUkzPB1WQt4AHSD7sPQ5BCy3Xiq1rgaAYl00mHG8VX403W/8tfL6cZ\ndAxnS2tUOiG84d+GBakImZv+eRif0QI6sV3ReF9y91kCgYEA6P0MDK7rjkO5Lg9d\nR4JNe41o4GVdnuXT/bAKHslEHpSh20zeRrdcSKJ6PgqZ8v1HhGMefHqf4DTA88mU\nmJcSpSl/vWBl8jpKQQnOKKPWr32lzUPdjSIrDMItBybe5hycyW/Hme3DatAPD2E5\nOhIkte2wnPaYrgJFdKY0YZDPY8MCgYEAwESGaN1m20wWTWNsm5LAh3u0mBwzGk7l\nhysfmLWLlRoS/ZG4fALuty045FVFNPw6RT+Y9amLutV7XR5muhofhrCaLS5juLSB\nVmysgDSNQHLhDPJ7JITr1U+WcnkeQv4qtg+M1z8WtUr9S/afWTEhhwrSvEqKp+Sc\nP4qzlEm12xUCgYEApF5ZUN1aq0wV6WvHd/pyZVbXBXAdw0sK6q92BFAjcZuUMJ2j\nNqqHPWr66KgcAfQzry8qQ9FS1x8AfTzaS2hRLBoB132ZjnEXD5k2Sy+C9t2iyhQ1\nyiqvyll24NPIbvkCl433eB3oPoO4DDaf49sG8R5V+fZyslhB3dCfpbE+zncCgYEA\nm+13DEiyiBtW4wBFLo5/seDzf4EvOKDPqSWiBFkHkK6KxDaP5ZMDQm9cemFlNSlx\noIOJa4JLHgTQfZ6QNVHGS5eiEg5TNZK+afbMl1UHUUNZnQRyNhXOpTpciw4LKs2y\nmeBWmqJBqlncvuSOKumbhUeTzLyvYqYWybmVFigJYlkCgYEArrLlwKC0kdDv/7Le\nn88NSDGLjjjrs7aUA266pkZDfYp5N4ALTnibNKSHIi5AyJD3Zgi+pQAbO7CulJ1W\n3o2Q2+7iZZAEM8tlRXFWTTH5yOmTYiAM9904OQWfIVokMBG6tYnGGHUmno4oOWSR\n+G+q4x34dJMsZMCYPpGR2wHtWVE=\n-----END PRIVATE KEY-----\n",
  },
  databaseURL: "https://crossroadsapp-dev.firebaseio.com"
});

var firebaseRef = Firebase.database().ref()

var eventsRef = firebaseRef.child("events")
var usersRef = firebaseRef.child("users")

function createEvent(event, user){
  createEventV2(event,user,false)
}

function createEventV2(event, user,useEventClan) {
  utils.l.d('createEventV2::event',utils.l.eventLog(event))
  utils.l.d('createEventV2::user',utils.l.userLog(user))
  utils.l.d('createEventV2::useEventClan',useEventClan)
  var clansRef = useEventClan && utils._.isValidNonBlank(event.clanId) ? eventsRef.child(event.clanId) : eventsRef.child(user.clanId)
  var id = event._id.toString()
  var eventObj = null

  // If the event has been deleted it will not have the 'creator' field
  if(event.creator) {
    // We want to remove _id and __v from event as it creates problems while saving in firebase
    eventObj = getEventObj(event)
  }

  clansRef.child(id).set(eventObj, function (error) {
    if (error) {
      utils.l.d("event creation failed in firebase", utils.l.eventLog(ventObj))
    } else {
      utils.l.d("event was created successfully in firebase", utils.l.eventLog(eventObj))
    }
  })
}

function updateEvent(event, user){
  updateEventV2(event, user,false)
}

function updateEventV2(event, user,useEventClan) {
  utils.l.d('updateEventV2::event',utils.l.eventLog(event))
  utils.l.d('updateEventV2::user',utils.l.userLog(user))
  utils.l.d('updateEventV2::useEventClan',useEventClan)

  var clansRef = useEventClan && utils._.isValidNonBlank(event.clanId) ? eventsRef.child(event.clanId) : eventsRef.child(user.clanId)
  var clansRef = eventsRef.child(user.clanId)
  var id = event._id.toString()
  // We want to remove _id and __v from event as it creates problems while saving in firebase
  var eventObj = getEventObj(event)

  clansRef.child(id).update(eventObj, function (error) {
    if (error) {
      utils.l.d("event creation failed in firebase", utils.l.eventLog(eventObj))
    } else {
      utils.l.d("event was updated successfully in firebase", utils.l.eventLog(eventObj))
    }
  })
}

function createUser(user) {
  var id = user._id.toString()
  var userObj = getUserObj(user)
  usersRef.child(id).set({value:userObj}, function (error) {
    if (error) {
      utils.l.d("user creation failed in firebase", utils.l.userLog(user))
    } else {
      utils.l.d("user was created successfully in firebase", utils.l.userLog(user))
    }
  })}

function updateUser(user) {
  var id = user._id.toString()
  var userObj = getUserObj(user)
  usersRef.child(id).update({value:userObj}, function (error) {
    if (error) {
      utils.l.d("user creation failed in firebase", utils.l.userLog(user))
    } else {
      utils.l.d("user was created successfully in firebase", utils.l.userLog(user))
    }
  })
}

function getEventObj(event) {
  // delete does not work on a mongoose object unless we convert it to a JSON object
  var eventObj = null
  try{
    eventObj = event.toObject()
  }catch(exp){
    eventObj = event
  }
  delete eventObj._id
  delete eventObj.__v
  return eventObj
}

function getUserObj(user) {
  var userObj = user.toObject()
  userObj._id = userObj._id.toString()
  delete userObj.passWord
  return userObj
}

module.exports = {
  createEvent: createEvent,
  updateEvent: updateEvent,
  createEventV2: createEventV2,
  updateEventV2: updateEventV2,
  createUser: createUser,
  updateUser: updateUser
}