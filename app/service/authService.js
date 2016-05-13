var models = require('../models')
var destinyService = require('./destinyInterface')
var utils = require('../utils')

function signupUser(userData, callback) {
	utils.async.waterfall(
			[
				function (callback) {
					models.user.createUserFromData(userData, callback)  // don't send message
				},
				function(newuser,callback) {
					//TBD: membershiptype is hardcoded to PSN for now. When we introduce multiple channels change this to take it from userdata
					// or send notification to both xbox and psn depending on the ID availability
					if(utils.config.enableBungieIntegration) {
						console.log("Destiny validation enabled")
						destinyService.sendBungieMessage(userData.psnId, "PSN", utils.constants.bungieMessageTypes.accountVerification, function (error, messageResponse) {
							if (messageResponse) {
								utils.l.d("messageResponse::token===" + messageResponse.token)
								newuser.psnVerified = "INITIATED"
								newuser.psnToken = messageResponse.token
								newuser.bungieMemberShipId = messageResponse.bungieMemberShipId
							} else {
								newuser.psnVerified = "FAILED_INITIATION"
							}
							models.user.save(newuser, callback)
						})
					}else {
						console.log("Destiny validation disabled")
						callback(null, newuser)
					}
				}
			],
			callback
	)
}

function requestResetPassword(userData, callback) {
	utils.async.waterfall(
			[
				function(callback) {
					//TBD: membershiptype is hardcoded to PSN for now. When we introduce multiple channels change this to take it from userdata
					// or send notification to both xbox and psn depending on the ID availability
					if(utils.config.enableBungieIntegration) {
						console.log("Destiny validation enabled")
						destinyService.sendBungieMessage(userData.psnId, "PSN", utils.constants.bungieMessageTypes.passwordReset, function (error, messageResponse) {
							if (messageResponse) {
								utils.l.d("messageResponse::token===" + messageResponse.token)
								userData.passwordResetToken = messageResponse.token
							}
							models.user.save(userData, callback)
						})
					}else {
						console.log("Destiny validation disabled")
						callback(null, userData)
					}
				}
			],
			callback
	)
}

module.exports = {
	signupUser: signupUser,
	requestResetPassword: requestResetPassword
}