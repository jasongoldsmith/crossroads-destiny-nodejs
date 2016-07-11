var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Mixed = Schema.Types.Mixed

var UserGroupSchema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  date: { type: Date, required: true },
  uDate: Date,
  groups:[{type:Mixed}]
})

UserGroupSchema.index({'user':1}, {'unique': true})
UserGroupSchema.index({"__v": 1, "_id": 1})


UserGroupSchema.pre('validate', function(next) {
  this.uDate = new Date()
  if (this.isNew) {
    this.date = new Date()
  }
  next()
})


module.exports = {
  schema: UserGroupSchema
}