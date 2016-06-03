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
  //psnId: { type: String, required: true },
  consoles: [{consoleType:consoleTypeEnum,consoleId:{type:String}}],
  //xboxId: String,
  clanId: { type: String, default: "clan_id_not_set"},
  imageUrl: String,
  uDate: Date,
  signupDate: Date,
  flags: Mixed,
  //psnVerified:{ type: String, enum: ['VERIFIED','INITIATED','FAILED_INITIATION','NOT_INITIATED'], default: "NOT_INITIATED"},
  acctVerified: [{consoleType:consoleTypeEnum,status:acctVerifyEnum}],
  accountVerifyToken:[{consoleType:consoleTypeEnum,token:{type:String}}],
  //psnToken:{ type: String},
  bungieMemberShipId:{type: String},
  passwordResetToken:{type: String},
  groups:[{type:Mixed}]
})

UserSchema.index({'userName':1}, {'unique': true})
//UserSchema.index({'psnId':1}, {'unique': true, 'sparse':true})
//UserSchema.index({'xboxId':1}, {'unique': true, 'sparse':true})
//UserSchema.index({'psnToken':1}, {'unique': true, 'sparse':true})
UserSchema.index({'name':1})
UserSchema.index({'groups.groupId':1})
UserSchema.index({'consoles.id':1})
UserSchema.index({'accountVerifyToken.token':1})
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