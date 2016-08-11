var utils = require('../utils')
var mongoose = require('mongoose')

// Notification Schema
var notificationQueueSchema = require('./schema/notificationQueueSchema')

// Model initialization
var NotificationQueue = mongoose.model('NotificationQueue', notificationQueueSchema.schema)

function getByQuery(query, callback) {
	NotificationQueue
		.find(query)
		.exec(callback)
}

function addToQueue(event, userList, comment, notificationType) {
	var notificationQueueData = {
		event: event ? event.toObject() : null,
		userList: userList ? userList.toObject() : null,
		comment: comment,
		notificationType: notificationType
	}
	var notificationQueueObj = new NotificationQueue(notificationQueueData)

	notificationQueueObj.save(function (err, notificationQueueResult) {
		if(err) {
			utils.l.i("unable to add to notification queue", err)
		} else {
			utils.l.d("Successfully added to the notification queue", notificationQueueResult)
		}
	})
}

function getNotificationFromQueue(notificationType, callback) {
	getByQuery({notificationType: notificationType}, callback)
}

module.exports = {
	addToQueue: addToQueue,
	getNotificationFromQueue: getNotificationFromQueue
}