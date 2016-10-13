var models = require('../models')
var destinyService = require('./destinyInterface')
var utils = require('../utils')
var userService = require('./userService')

function signupUser(signupData, callback) {
	utils.async.waterfall([
		function(callback){
			models.user.getByQuery({userName: signupData.userName}, utils.firstInArrayCallback(callback))
		},
		function(user, callback) {
			if(utils._.isValidNonBlank(user)) {
				return callback({error: "That username is already taken"}, null)
			} else if(utils.config.enableBungieIntegration) {
				destinyService.getBungieHelmet(
					signupData.consoles[0].consoleId,
					signupData.consoles[0].consoleType,
					null,
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
					}
				)
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
				utils.l.d("Destiny validation disabled")
				return callback(null, signupData)
			}
		},
		function(newUser,callback){
			newUser.clanName = utils.constants.freelanceBungieGroup.groupName
			getCurrentLegalObject(function(err,legal){
				newUser.legal = legal
				utils.l.d('signup::getCurrentLegalObject',newUser)
				utils.l.d("creating user", utils.l.userLog(newUser))
				models.user.createUserFromData(newUser, callback)  // don't send message
			})
		}
	], callback)
}

function createNewUser(signupData,validateBungie,verifyStatus,messageType,messageDetails,callback){
	var primaryConsole = utils.primaryConsole(signupData)
	signupData.imageUrl = primaryConsole.imageUrl
	utils.async.waterfall([
		function(callback){
			if(validateBungie) {
				destinyService.sendBungieMessageV2(signupData.bungieMemberShipId,
						utils._.get(utils.constants.consoleGenericsId, primaryConsole.consoleType),
						messageType,messageDetails,
						function (error, messageResponse) {
							utils.l.d('messageResponse', messageResponse)
							utils.l.d('signupUser::sendBungieMessage::error', error)
							if (messageResponse) {
								utils.l.d("messageResponse::token===" + messageResponse.token)
								signupData.verifyStatus = verifyStatus
								signupData.verifyToken = messageResponse.token
								return callback(null, signupData)
							} else {
								if(messageType == utils.constants.bungieMessageTypes.eventInvitation){
									signupData.verifyStatus = "INVITATION_MSG_FAILED"
									return callback(null, signupData)
								}else
									return callback(error, null) //This is the case where user is signing up in the normal flow
							}
						})
			}else {
				return callback(null, signupData)
			}
		},function(newUser,callback){
			newUser.clanName=utils.constants.freelanceBungieGroup.groupName
			getCurrentLegalObject(function(err,legal){
				newUser.legal = legal
				utils.l.d('signup::getCurrentLegalObject',newUser)
				utils.l.d("creating user", utils.l.userLog(newUser))
				models.user.createUserFromData(newUser, callback)  // don't send message
			})
		}
	],callback)
}

function requestResetPassword(userData, callback) {
	utils.async.waterfall([
		function(callback) {
			//TBD: membershiptype is hardcoded to PSN for now. When we introduce multiple channels change this to take it from userdata
			// or send notification to both xbox and psn depending on the ID availability
			if(utils.config.enableBungieIntegration) {
				utils.l.d("Destiny validation enabled")
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
				utils.l.d("Destiny validation disabled")
				return callback(null, userData)
			}
		}
	], callback)
}

function addLegalAttributes(user,callback){
	var userLegal = JSON.parse(JSON.stringify(user))
	models.sysConfig.getSysConfigList([utils.constants.sysConfigKeys.termsVersion,utils.constants.sysConfigKeys.privacyPolicyVersion], function(err, sysConfigs) {
		var termsVersionObj =  utils._.find(sysConfigs, {"key": utils.constants.sysConfigKeys.termsVersion})
		var privacyObj = utils._.find(sysConfigs, {"key": utils.constants.sysConfigKeys.privacyPolicyVersion})
		if(userLegal.legal.termsVersion != termsVersionObj.value.toString()) userLegal.legal.termsNeedsUpdate = true
		else userLegal.legal.termsNeedsUpdate = false

		if(userLegal.legal.privacyVersion != privacyObj.value.toString()) userLegal.legal.privacyNeedsUpdate = true
		else userLegal.legal.privacyNeedsUpdate = false

		return callback(null,userLegal)
	})
}

function listMemberCountByClan(groupIds,consoleType, callback) {
	models.user.listMemberCount(groupIds, consoleType, callback)
}

function getCurrentLegalObject(callback){
		models.sysConfig.getSysConfigList([utils.constants.sysConfigKeys.termsVersion,utils.constants.sysConfigKeys.privacyPolicyVersion],function(err, sysConfigs){
			var termsVersionObj =  utils._.find(sysConfigs, {"key": utils.constants.sysConfigKeys.termsVersion})
			var privacyObj = utils._.find(sysConfigs, {"key": utils.constants.sysConfigKeys.privacyPolicyVersion})
			var legal = {termsVersion:termsVersionObj.value.toString(),
										privacyVersion:privacyObj.value.toString()}
			return callback(null, legal)
		})
}

function createUsersWithConsoles(consoleIdList, consoleType, messageDetails, callback){
	utils.async.waterfall([
		function(callback){
			utils.async.mapSeries(consoleIdList,function(consoleId,asyncCallback){
				utils.l.d("^^^^^^^^^^^^^^^^^^^^^")
				validateConsole({
					consoleId: consoleId,
					consoleType: consoleType,
				},asyncCallback)
				utils.l.d("^^^^^^^^^^^^^^^^^^^^^")
			},function(errors, bungieMemberList){
				return callback(errors,bungieMemberList)
			})
		},function(bungieMembersList,callback){
			utils.l.d("******************************************************************:bungieMembersList::",bungieMembersList)
			utils.async.mapSeries(bungieMembersList, function(bungieMember,asyncCallback){
				utils.l.d("**********************",bungieMember)
				createInvitedUsers(bungieMember,consoleType,messageDetails,asyncCallback)
				utils.l.d("**********************")
			},function(errors, userList){
				return callback(errors,userList)
			})
		}
	],callback)
}

function validateConsole(console, callback){

	userService.checkBungieAccount(console,function(err,bungieResponse){
		var bungieMember = {
			consoleId: console.consoleId,
			consoleType: console.consoleType,
		}

		if(utils._.isInvalidOrBlank(bungieResponse) || utils._.isValidNonBlank(err)) {
			bungieMember.verifyStatus="INVALID_GAMERTAG"
		}else{
			bungieMember.bungieMemberShipId= bungieResponse.bungieMemberShipId
			bungieMember.destinyProfile= bungieResponse.destinyProfile
			bungieMember.verifyStatus="INVITED"
		}

		return callback(null,bungieMember)
	})
}

function createInvitedUsers(bungieMembership,consoleType,messageDetails,callback){
	utils.l.d("**********************createInvitedUsers::",bungieMembership)
	var userData = null
	var validateBungie = false
	if(bungieMembership.verifyStatus == "INVALID_GAMERTAG"){
		userData = userService.getNewUserData("crossroads",null,null,false,null,consoleType)
		validateBungie = false
		var consolesList =  []
		var consoleObj = {}
		consoleObj.consoleType =  bungieMembership.consoleType
		consoleObj.consoleId=bungieMembership.consoleId
		consoleObj.isPrimary = true
		consolesList.push(consoleObj)
		userData.consoles = consolesList
		userData.verifyStatus = bungieMembership.verifyStatus
	}else{
		validateBungie = true
		userData = userService.getNewUserData("crossroads",null,null,false,bungieMembership,consoleType)
		userData.verifyStatus = bungieMembership.verifyStatus
	}

	var uid = utils.mongo.ObjectID()
	userData._id = uid
/*
	var messageDetails = {
		event: event,
 		invitedByGamerTag: invitedByGamerTag,
		invitationLink: invitationLink
	}
*/
	createNewUser(userData,validateBungie,bungieMembership.verifyStatus,utils.constants.bungieMessageTypes.eventInvitation,messageDetails, callback)
}

module.exports = {
	signupUser: signupUser,
	requestResetPassword: requestResetPassword,
	listMemberCountByClan: listMemberCountByClan,
	addLegalAttributes:addLegalAttributes,
	createNewUser:createNewUser,
	createUsersWithConsoles:createUsersWithConsoles
}