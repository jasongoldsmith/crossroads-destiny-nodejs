var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var Mixed = Schema.Types.Mixed;
var utils = require('../../utils')

var activitySchema = new Schema({
	aType: {type: String, required: true},
	aSubType: String,
	aCheckpoint: String,
	aDifficulty: String,
	aLight: Number,
	minPlayers: Number,
	maxPlayers: Number
})

activitySchema.index({'aType': 1})

module.exports = {
	schema: activitySchema
}