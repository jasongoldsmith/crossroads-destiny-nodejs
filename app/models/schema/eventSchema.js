var mongoose = require('mongoose')
var Schema = mongoose.Schema

var eventSchema = new Schema({
	eType: { type: Schema.Types.ObjectId, ref: 'Activity', required: true },
	status: { type: String, enum: ['new', 'open', 'full', 'can_join']},
	minPlayers: Number,
	maxPlayers: Number,
	creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	players: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
	created: { type: Date, default: Date.now },
	updated: { type: Date, default: Date.now }
})

eventSchema.index({'eType': 1})

eventSchema.pre('validate', function(next) {
	this.updated = new Date()
	if (this.isNew) {
		this.created = new Date()
	}

	this.status = "new"
	next()
})

eventSchema.pre('update', function() {
	this.updated = new Date()
})

module.exports = {
	schema: eventSchema
}