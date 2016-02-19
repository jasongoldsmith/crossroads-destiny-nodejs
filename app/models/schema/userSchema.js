var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Mixed = Schema.Types.Mixed;
var utils = require('../../utils');

var LoginSchema = require('./loginSchema');



var UserSchema = new Schema({
  name: String,
  profileUrl : String,
  userName: {type: String, required: true},
  date: {type: Date, required: true},
  passWord: {type: String, required: true},
  uniqueID : String,
  psnId: String,
  xboxId: String,
  uDate: Date,
  signupDate: Date,
  flags: Mixed
});

UserSchema.index({'userName':1}, {'unique': true});
UserSchema.index({'name':1});
UserSchema.index({'date': 1});
UserSchema.index({"__v": 1, "_id": 1});


UserSchema.pre('validate', function(next) {
  this.uDate = new Date();
  if (this.isNew) {
    this.date = new Date();
  }
  next();
});


module.exports = {
  schema: UserSchema
};