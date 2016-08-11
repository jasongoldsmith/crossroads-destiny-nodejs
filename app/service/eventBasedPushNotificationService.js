var utils = require('../utils')
var models = require('../models')
var notificationTriggerService = require('./eventNotificationTriggerService')

function sendPushNotificationForNewCreate(event) {
	utils.async.waterfall([
		function (callback) {
			models.notificationTrigger.getByQuery({triggerName: "Create"}, utils.firstInArrayCallback(callback))
		},
		function (notificationTrigger, callback) {
			notificationTriggerService.handleNewEvents(event, notificationTrigger, callback)
		}
	], function (err, updatedEvent) {
		if (err) {
			utils.l.s("Error in sendPushNotificationForNewCreate::"+err+"::"+JSON.stringify(updatedEvent))
		} else {
			utils.l.d("sendPushNotificationForNewCreate successful::", updatedEvent)
		}
	})
}

function sendPushNotificationForJoin(event, playerList) {
	utils.async.waterfall([
		function (callback) {
			models.notificationTrigger.getByQuery({triggerName: "Join"}, utils.firstInArrayCallback(callback))
		},
		function (notificationTrigger, callback) {
			notificationTriggerService.handleJoinEvent(event, notificationTrigger, playerList, callback)
		}
	], function (err, updatedEvent) {
		if (err) {
			utils.l.s("Error in sendPushNotificationForJoin::"+err+"::"+JSON.stringify(updatedEvent))
		} else {
			utils.l.d("sendPushNotificationForJoin successful::", updatedEvent)
		}
	})
}

function sendPushNotificationForLeave(event, user) {
	utils.async.waterfall([
		function (callback) {
			models.notificationTrigger.getByQuery({triggerName: "Leave"}, utils.firstInArrayCallback(callback))
		},
		function (notificationTrigger, callback) {
			notificationTriggerService.handleLeaveEvent(event, user[0], notificationTrigger, callback)
		}
	], function (err, updatedEvent) {
		if (err) {
			utils.l.s("Error in sendPushNotificationForLeave::"+err+"::"+JSON.stringify(updatedEvent))
		} else {
			utils.l.d("sendPushNotificationForLeave successful::", updatedEvent)
		}
	})
}

function sendPushNotificationForAddComment(event, playerList, comment) {
	utils.async.waterfall([
		function (callback) {
			models.notificationTrigger.getByQuery({triggerName: "AddComment"}, utils.firstInArrayCallback(callback))
		},
		function (notificationTrigger, callback) {
			notificationTriggerService.handleAddComment(event, notificationTrigger, playerList, comment, callback)
		}
	], function (err, updatedEvent) {
		if (err) {
			utils.l.s("Error in sendPushNotificationForAddComment::"+err+"::"+JSON.stringify(updatedEvent))
		} else {
			utils.l.d("sendPushNotificationForAddComment successful::", updatedEvent)
		}
	})
}

module.exports ={
	sendPushNotificationForNewCreate: sendPushNotificationForNewCreate,
	sendPushNotificationForJoin: sendPushNotificationForJoin,
	sendPushNotificationForLeave: sendPushNotificationForLeave,
	sendPushNotificationForAddComment: sendPushNotificationForAddComment
}