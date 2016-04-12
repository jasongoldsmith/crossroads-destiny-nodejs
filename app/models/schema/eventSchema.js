var mongoose = require('mongoose')
var Schema = mongoose.Schema
var idValidator = require('mongoose-id-validator')

var eventSchema = new Schema({
	eType: { type: Schema.Types.ObjectId, ref: 'Activity', required: true },
	status: { type: String, enum: ['new', 'open', 'full', 'can_join']},
	launchStatus: { type: String, enum: ['now', 'upcoming'], default: "now"},
	minPlayers: { type : Number, required : true },
	maxPlayers: { type : Number, required : true },
	creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	players: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
	created: { type: Date, default: Date.now },
	updated: { type: Date, default: Date.now },
	launchDate: { type: Date, default: Date.now }
})

eventSchema.index({'eType': 1})

eventSchema.pre('validate', function(next) {
	if (this.isNew) {
		this.created = new Date()
	}
	this.updated = new Date()

	var size = this.players.length
	if ( size == 1 ) {
		this.status="new"
	} else if ( size < this.minPlayers ) {
		this.status="open"
	} else if ( size >= this.minPlayers && size < this.maxPlayers ) {
		this.status="can_join"
	} else {
		this.status="full"
	}
	next()
})

module.exports = {
	schema: eventSchema
}

eventSchema.plugin(idValidator)