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

					destinyService.sendBungieMessage(userData.psnId,userData.userName,"PSN",function(error,messageResponse){
						if(messageResponse){
							utils.l.d("messageResponse::token==="+messageResponse.token)
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