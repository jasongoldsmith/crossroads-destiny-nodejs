var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Mixed = Schema.Types.Mixed
var consoleTypeEnum = {type:String, enum: ['PS4','XBOX360','XBOXONE','PS3']}
var acctVerifyEnum = {type:String, enum: ['VERIFIED','INITIATED','FAILED_INITIATION','NOT_INITIATED'], default: "NOT_INITIATED"}

var UserSchema = new Schema({
  name: String,
  profileUrl : String,
  userName: { type: String, required: true },
  date: { type: Date, required: true },
  passWord: { type: String, required: true },
  uniqueID : String,
  consoles: [{consoleType:consoleTypeEnum,consoleId:{type:String},verifyStatus:acctVerifyEnum,verifyToken:{type:String},isPrimary:{type:Boolean,default:true}}],
  clanId: { type: String, default: "clan_id_not_set"},
  imageUrl: String,
  uDate: Date,
  signupDate: Date,
  flags: Mixed,
  bungieMemberShipId:{type: String},
  passwordResetToken:{type: String},
  groups:[{type:Mixed}],
  lastActiveTime:Date,
  isLoggedIn: {type: Boolean, default: true},
  notifStatus:[{type: String}]
})

UserSchema.index({'userName':1}, {'unique': true})
UserSchema.index({'name':1})
UserSchema.index({'groups.groupId':1})
UserSchema.index({'consoles.consoleId':1})
UserSchema.index({'consoles.verifyToken':1})
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