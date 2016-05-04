var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')

// Activity Schema
var notificationTriggerSchema = require('./schema/notificationTriggerSchema')

// Model initialization
var NotificationTrigger = mongoose.model('NotificationTrigger', notificationTriggerSchema.schema)


function getByQuery(query, callback) {
	return callback(null,[{triggerName:'launchUpcomingEvents',
													schedule:'*/1 * * * *',
													isActive:true,
													notifications:[{name:'NoSignupNotification',messageTemplate:'NoSignupNotification for clanNotEventMembers',recipientType:'clanNotEventMembers',isActive:true},
																					{name:'EventNotFullNotification',messageTemplate:'EventNotFullNotification for clanNotEventMembers',recipientType:'clanNotEventMembers',isActive:true},
																					{name:'EventStartedNotification',messageTemplate:'EventStartedNotification for eventMembers',recipientType:'eventMembers',isActive:true}]
												},
												{triggerName:'launchEventStart',schedule:'*/2 * * * *',isActive:true,
													notifications:[{name:'EventFullNotification',messageTemplate:'EventFullNotification for eventMembers',recipientType:'eventMembers',isActive:true}]
												}
											])
}

module.exports = {
	model: NotificationTrigger,
	getByQuery: getByQuery,
}