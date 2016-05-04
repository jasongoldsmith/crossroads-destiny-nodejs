var mongoose = require('mongoose')
var Schema = mongoose.Schema
var idValidator = require('mongoose-id-validator')

var notificationSchema = new Schema({
	name: {type : String, required : true},
	messageTemplate: {type : String, required : true},
	recipientType: {type : String, required : true,
		enum: ['creator', 'eventMembers', 'eventMembersNotCreator', 'clanNotEventMembers', 'clan']},
})

module.exports = {
	schema: notificationSchema
}

notificationSchema.plugin(idValidator)