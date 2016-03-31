var models = require('../models')

function signupUser(userData, callback) {
	models.user.createUserFromData(userData, callback)  // don't send message
}

module.exports = {
	signupUser: signupUser
}