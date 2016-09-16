var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Mixed = Schema.Types.Mixed
var consoleTypeEnum = {type: String, enum: ['PS4','XBOX360','XBOXONE','PS3']}
var acctVerifyEnum = {
  type: String,
  enum: ['VERIFIED','INITIATED','FAILED_INITIATION','NOT_INITIATED'],
  default: "NOT_INITIATED"
}

var UserSchema = new Schema({
  name: String,
  profileUrl : String,
  userName: {type: String},
  date: {type: Date, required: true},
  passWord: {type: String, required: true},
  uniqueID : String,
  verifyStatus:String,
  verifyToken:String,
  consoles: [{
    consoleType: consoleTypeEnum,
    consoleId: {type: String},
    verifyStatus: acctVerifyEnum,
    verifyToken: {type: String},
    clanTag: String,
    destinyMembershipId: String,
    imageUrl: String,
    isPrimary: {type: Boolean, default: false}
  }],
  clanId: {type: String, default: "clan_id_not_set"},
  clanName: {type: String},
  clanImageUrl: {type:String},
  imageUrl: String,
  uDate: Date,
  signupDate: Date,
  flags: Mixed,
  bungieMemberShipId:{type: String},
  passwordResetToken:{type: String},
  groups:[{type: Mixed}],
  lastActiveTime: Date,
  isLoggedIn: {type: Boolean, default: true},
  notifStatus:[{type: String}],
  lastCommentReportedTime: Date,
  commentsReported: {type: Number, default: 0},
  hasReachedMaxReportedComments: {type: Boolean, default: false},
  legal: {
    termsVersion: {type: String, default: "0.0"},
    privacyVersion: {type: String,default: "0.0"}
  },
  stats: {
    eventsCreated: {type: Number, default: 0},
    eventsJoined: {type: Number, default: 0},
    eventsLeft: {type: Number, default: 0},
    eventsFull: {type: Number, default: 0}
  },
  mpDistinctId:String
})

UserSchema.index({'userName':1})
UserSchema.index({'consoles.consoleId':1})
UserSchema.index({'consoles.verifyToken':1})
UserSchema.index({'verifyToken':1})
UserSchema.index({'date': 1})
UserSchema.index({"groups.groupId": 1})


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