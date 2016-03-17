var mongoose = require('mongoose')
var Schema = mongoose.Schema

var activitySchema = new Schema({
	aType: {type : String, required : true},
	aSubType: String,
	aCheckpoint: String,
	aDifficulty: String,
	aLight: Number,
	aLevel: Number,
	aIconUrl: String,
	minPlayers: { type : Number, required : true },
	maxPlayers: { type : Number, required : true }
})

activitySchema.index({'aType': 1})

module.exports = {
	schema: activitySchema
}