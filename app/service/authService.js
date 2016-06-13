var models = require('../models')
var destinyService = require('./destinyInterface')
var utils = require('../utils')

function signupUser(userData, callback) {
	utils.async.waterfall(
			[
				function(callback){
					models.user.getByQuery({"$or":[{"userName":userData.userName},{"consoles.consoleType":userData.consoles[0].consoleType,"consoles.consoleId":userData.consoles[0].consoleId}]},callback)
				},
				function(existingUsers, callback){
					userExists(existingUsers,userData,callback)
				},
				function(user, callback) {
					//TBD: membershiptype is hardcoded to PSN for now. When we introduce multiple channels change this to take it from userdata
					// or send notification to both xbox and psn depending on the ID availability
					if(utils.config.enableBungieIntegration) {
						console.log("Destiny validation enabled")
						destinyService.sendBungieMessage(userData.bungieMemberShipId, utils._.get(utils.constants.consoleGenericsId, userData.consoles[0].consoleType), utils.constants.bungieMessageTypes.accountVerification, function (error, messageResponse) {
							utils.l.d('messageResponse',messageResponse)
							utils.l.d('signupUser::sendBungieMessage::error',error)
							if (messageResponse) {
								utils.l.d("messageResponse::token===" + messageResponse.token)
								userData.consoles[0].verifyStatus = "INITIATED"
								userData.consoles[0].verifyToken = messageResponse.token
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
	var consoleExists = false;
	var userNameExists = false;
	var error = null
	utils._.map(existingUsers,function(user){
		user=JSON.parse(JSON.stringify(user))
		var existingConsole = utils._.find(user.consoles,userData.consoles[0])
		if(existingConsole && !consoleExists){
			consoleExists = true
		}
		if(user.userName == userData.userName && !userNameExists){
			userNameExists = true
		}
	})
	if(consoleExists && userNameExists){
		error = {error:"The User name and "+utils._.get(utils.constants.consoleGenericsId,userData.consoles[0].consoleType)+" "+userData.consoles[0].consoleId+" is already taken"}
	}else{
		if(userNameExists) error = {error:"That User name is already taken"}
		if(consoleExists ) error = {error:"That "+utils._.get(utils.constants.consoleGenericsId,userData.consoles[0].consoleType)+" "+userData.consoles[0].consoleId+" is already taken"}
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
						destinyService.sendBungieMessage(userData.bungieMemberShipId, userData.consoles[0].consoleType, utils.constants.bungieMessageTypes.passwordReset, function (error, messageResponse) {
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

function listMemberCountByClan(groupIds,consoleType, callback){
	models.user.listMemberCount(groupIds,consoleType,callback)
}

module.exports = {
	signupUser: signupUser,
	requestResetPassword: requestResetPassword,
	listMemberCountByClan:listMemberCountByClan
}