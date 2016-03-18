var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Mixed = Schema.Types.Mixed

var UserSchema = new Schema({
  name: String,
  profileUrl : String,
  userName: { type: String, required: true },
  date: { type: Date, required: true },
  passWord: { type: String, required: true },
  uniqueID : String,
  psnId: { type: String, required: true },
  xboxId: String,
  clanId: String,
  imageUrl: String,
  uDate: Date,
  signupDate: Date,
  flags: Mixed
})

UserSchema.index({'userName':1}, {'unique': true})
UserSchema.index({'psnId':1}, {'unique': true, 'sparse':true})
UserSchema.index({'xboxId':1}, {'unique': true, 'sparse':true})
UserSchema.index({'name':1})
UserSchema.index({'date': 1})
UserSchema.index({"__v": 1, "_id": 1})


UserSchema.pre('validate', function(next) {
  this.uDate = new Date()
  if (this.isNew) {
    this.date = new Date()
  }
  next()
})


module.exports = {
  schema: UserSchema
}