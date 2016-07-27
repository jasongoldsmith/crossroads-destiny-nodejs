var mongoose = require('mongoose')
var Schema = mongoose.Schema

var activitySchema = new Schema({
	aType: {type: String, required: true},
	aSubType: String,
	aCheckpoint: String,
	aDifficulty: String,
	tag: String,
	aLight: Number,
	aLevel: Number,
	aIconUrl: String,
	isActive: {type: Boolean, default: true},
	isFeatured: {type: Boolean, default: false},
	adCard: {
		isAdCard: {type: Boolean, default: false},
		adCardBaseUrl: String,
		adCardImagePath: String,
		adCardHeader: String,
		adCardSubHeader: String,
	},
	location: String,
	minPlayers: {type : Number, required : true},
	maxPlayers: {type : Number, required : true}
})

activitySchema.index({'aType': 1})

module.exports = {
	schema: activitySchema
}