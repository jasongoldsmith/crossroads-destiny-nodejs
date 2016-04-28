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
					destinyService.sendBungieMessage(userData.psnId,userData.userName,function(error,messageResponse){
						utils.l.d("messageResponse::token==="+messageResponse.token)
						if(messageResponse){
							newuser.psnVerified = "INITIATED"
							newuser.psnToken = messageResponse.token
						}else{
							newuser.psnVerified = "FAILED_INITIATION"
						}
						models.user.save(newuser,callback)
					})
				}
			],
			callback
	)
}

module.exports = {
	signupUser: signupUser
}