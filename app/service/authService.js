var models = require('../models')
var destinyService = require('./destinyInterface')
var utils = require('../utils')

function signupUser(userData, callback) {
	utils.async.waterfall(
			[
				function(callback){
					models.user.getByQuery({"$or":[{"userName":userData.userName},{"psnId":userData.psnId}]},callback)
				},
				function(existingUsers, callback){
					userExists(existingUsers,userData,callback)
				},
				function(user, callback) {
					//TBD: membershiptype is hardcoded to PSN for now. When we introduce multiple channels change this to take it from userdata
					// or send notification to both xbox and psn depending on the ID availability
					if(utils.config.enableBungieIntegration) {
						console.log("Destiny validation enabled")
						destinyService.sendBungieMessage(userData.psnId, "PSN", utils.constants.bungieMessageTypes.accountVerification, function (error, messageResponse) {
							utils.l.d('messageResponse',messageResponse)
							utils.l.d('signupUser::sendBungieMessage::error',error)
							if (messageResponse) {
								utils.l.d("messageResponse::token===" + messageResponse.token)
								userData.psnVerified = "INITIATED"
								userData.psnToken = messageResponse.token
								userData.bungieMemberShipId = messageResponse.bungieMemberShipId
								callback(null, userData)
							} else {
								return callback(error, null)
							}
						})
					}else {
						console.log("Destiny validation disabled")
						callback(null, userData)
					}
				},function (newUser, callback) {
					models.user.createUserFromData(newUser, callback)  // don't send message
				}
			],
			callback
	)
}

function userExists(existingUsers,userData,callback){
	var psnExists = false;
	var userNameExists = false;
	var error = null
	utils._.map(existingUsers,function(user){
		user=JSON.parse(JSON.stringify(user))
		if((user.psnId == userData.psnId) && !psnExists){
			psnExists = true
		}
		if(user.userName == userData.userName && !userNameExists){
			userNameExists = true
		}
	})

	if(psnExists && userNameExists){
		error = {error:"The User name and PSN Id are already taken"}
	}else{
		if(userNameExists) error = {error:"That User name is already taken"}
		if(psnExists) error = {error:"That PSN ID is already taken"}
	}

	return callback(error,null)
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

function listMemberCountByClan(groupIds, callback){
	models.user.listMemberCount("clanId",{clanId:{$in:groupIds}},callback)
}

module.exports = {
	signupUser: signupUser,
	requestResetPassword: requestResetPassword,
	listMemberCountByClan:listMemberCountByClan
}