var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Mixed = Schema.Types.Mixed

var notificationQueueSchema = new Schema({
	event: {type: Mixed},
	userList: [{type: Mixed}],
	comment: String,
	notificationType: {type: String, enum: ['Join', 'Leave', 'NewCreate', 'AddComment']}
})

module.exports = {
	schema: notificationQueueSchema
}