var mongoose = require('mongoose')
var Schema = mongoose.Schema

var activitySchema = new Schema({
	aType: {type: String, required: true},
	aSubType: String,
	aCheckpoint: String,
	aCheckpointOrder: Number,
	aDifficulty: String,
	tag: String,
	aDisplayName: String,
	aDescription:String,
	aStory:String,
	aModifiers: [{
		aModifierName: String,
		aModifierInfo: String,
		aModifierIconUrl: String,
		isActive: Boolean
	}],
	aBonus:[{
		aBonusName: String,
		aBonusInfo: String,
		aBonusIconUrl: String,
		isActive: Boolean
	}],
	aLocation : {
		aDirectorLocation: String,
		aSubLocation: String,
	},
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
	aImage: {
		aImageBaseUrl: String,
		aImageImagePath: String
	},
	minPlayers: {type : Number, required : true},
	maxPlayers: {type : Number, required : true}
})

activitySchema.index({'aType': 1})

module.exports = {
	schema: activitySchema
}