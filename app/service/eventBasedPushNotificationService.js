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

function sendPushNotificationForJoin(event) {
	utils.async.waterfall([
		function (callback) {
			models.notificationTrigger.getByQuery({triggerName: "Join"}, utils.firstInArrayCallback(callback))
		},
		function (notificationTrigger, callback) {
			notificationTriggerService.handleJoinEvent(event, notificationTrigger, callback)
		}
	], function (err, updatedEvent) {
		if (err) {
			utils.l.s("Error in sendPushNotificationForJoin::"+err+"::"+JSON.stringify(updatedEvent))
		} else {
			utils.l.d("sendPushNotificationForJoin successful::", updatedEvent)
		}
	})
}

module.exports ={
	sendPushNotificationForNewCreate: sendPushNotificationForNewCreate,
	sendPushNotificationForJoin: sendPushNotificationForJoin
}