var mongoose = require('mongoose')
var Schema = mongoose.Schema

var GroupSchema = new Schema({
  _id:String,
  groupName: String,
  date: { type: Date, required: true },
  uDate: Date,
  avatarPath:String,
  bungieMemberCount:Number,
  clanEnabled:Boolean,
  appStats:[{
    consoleType:String,
    memberCount:Number
  }]
})

GroupSchema.index({"__v": 1, "_id": 1})

GroupSchema.pre('validate', function(next) {
  this.uDate = new Date()
  if (this.isNew) {
    this.date = new Date()
  }
  next()
})


module.exports = {
  schema: GroupSchema
}