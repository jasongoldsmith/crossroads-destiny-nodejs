var models = require('../models')
var destinyService = require('./destinyInterface')
var utils = require('../utils')

function signupUser(signupData, callback) {
	utils.async.waterfall([
		function(callback){
			models.user.getByQuery({userName: signupData.userName}, utils._.firstInArrayCallback(callback))
		},
		function(user, callback) {
			if(utils._.isValidNonBlank(user)) {
				return callback({error: "That User name is already taken"}, null)
			} else if(utils.config.enableBungieIntegration) {
				destinyService.getBungieHelmet(
					signupData.consoles[0].consoleId,
					signupData.consoles[0].consoleType,
					function(err, helmet) {
						if(err) {
							return callback(err, null)
						} else {
							signupData.imageUrl = utils.config.bungieBaseURL + "/" +helmet.helmetURL
							//TODO: add imageUrl and clanTag in the consoles object of userSchema.
							signupData.consoles[0].imageUrl = utils.config.bungieBaseURL + "/" +helmet.helmetURL
							signupData.consoles[0].destinyMembershipId = helmet.destinyProfile.memberShipId
							signupData.consoles[0].clanTag = helmet.clanTag
							signupData.consoles[0].isPrimary = true
							return callback(null, signupData)
						}
					})
				} else {
					return callback(null, signupData)
				}
			},
		function(user, callback) {
			//TBD: membershiptype is hardcoded to PSN for now. When we introduce multiple channels change this to take it from userdata
			// or send notification to both xbox and psn depending on the ID availability
			if(utils.config.enableBungieIntegration) {
				utils.l.d("Destiny validation enabled", signupData)
				destinyService.sendBungieMessage(
					signupData.bungieMemberShipId,
					utils._.get(utils.constants.consoleGenericsId, signupData.consoles[0].consoleType),
					utils.constants.bungieMessageTypes.accountVerification,
					function (error, messageResponse) {
						utils.l.d('messageResponse', messageResponse)
						utils.l.d('signupUser::sendBungieMessage::error', error)
						if (messageResponse) {
							utils.l.d("messageResponse::token===" + messageResponse.token)
							signupData.consoles[0].verifyStatus = "INITIATED"
							signupData.consoles[0].verifyToken = messageResponse.token
							return callback(null, signupData)
						} else {
							return callback(error, null)
						}
					})
			} else {
				utils.l.i("Destiny validation disabled")
				return callback(null, signupData)
			}
		},
		function (newUser, callback) {
			utils.l.d("creating user", utils.l.userLog(newUser))
			models.user.createUserFromData(newUser, callback)  // don't send message
		}
	], callback)
}

function requestResetPassword(userData, callback) {
	utils.async.waterfall([
		function(callback) {
			//TBD: membershiptype is hardcoded to PSN for now. When we introduce multiple channels change this to take it from userdata
			// or send notification to both xbox and psn depending on the ID availability
			if(utils.config.enableBungieIntegration) {
				utils.l.i("Destiny validation enabled")
				destinyService.sendBungieMessage(
					userData.bungieMemberShipId,
					utils.primaryConsole(userData).consoleType,
					utils.constants.bungieMessageTypes.passwordReset,
					function (err, messageResponse) {
						if(err) {
							return callback(err, null)
						} else {
							utils.l.d("messageResponse::token=== " + messageResponse.token)
							userData.passwordResetToken = messageResponse.token
						}
						models.user.save(userData, callback)
					})
			} else {
				utils.l.i("Destiny validation disabled")
				return callback(null, userData)
			}
		}
	], callback)
}

function listMemberCountByClan(groupIds,consoleType, callback) {
	models.user.listMemberCount(groupIds, consoleType, callback)
}

module.exports = {
	signupUser: signupUser,
	requestResetPassword: requestResetPassword,
	listMemberCountByClan: listMemberCountByClan
}