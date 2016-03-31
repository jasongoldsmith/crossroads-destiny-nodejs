var tUtils = require("../../../utils")
var utils = require("../../../../utils")
var cookie = require('cookie')
var helpers = require('../../../../helpers')
var mongoose = require('mongoose')
var service = require ('../../../../service/index')

var auth = require("../../../../routes/v1/auth")

describe("Successful test cases: ", function() {
	var userData1 = {
		"userName":"test1",
		"passWord":"test1",
		"psnId":"test1",
		"clanId":"1"
	}

	var userData2 = {
		"userName":"test2",
		"passWord":"test2",
		"psnId":"test2",
	}

	describe("test signup: ", function() {
		it("signup a user: ", function(done) {
			service.authService.signupUser(userData1, function(err, user) {
				validateSuccessfulSignupObject(user)
				done()
			})
		})

		it("signup a user without clanId and check clanId exists: ", function(done) {
			service.authService.signupUser(userData2, function(err, user) {
				validateSuccessfulSignupObject(user)
				utils.assert.equal(user.clanId, "clan_id_not_set", "default clanId is not set to clan_id_not_set")
				done()
			})
		})
	})

	after(function() {
		mongoose.connection.collection('users').remove(userData1)
		mongoose.connection.collection('users').remove(userData2)
	})
})

describe("Unsuccessful test cases: ", function() {
	describe("test signup: ", function() {

		it("signup a user without a psnID", function(done) {
			var userData = {
				"userName":"test1",
				"passWord":"test1",
				"clanId":"1"
			}
			service.authService.signupUser(userData, function(err, user) {
				validateErrorSignupObject(err, "psnId")
				done()
			})

		})

		it("signup a user without a userName", function(done) {
			var userData = {
				"passWord":"test",
				"psnId":"test",
				"clanId":"1"
			}
			service.authService.signupUser(userData, function(err, user) {
				validateErrorSignupObject(err, "userName")
				done()
			})

		})

		it("signup a user without a passWord", function(done) {
			var userData = {
				"userName":"test",
				"psnId":"test",
				"clanId":"1"
			}

			service.authService.signupUser(userData, function(err, user) {
				validateErrorSignupObject(err, "passWord")
				done()
			})

		})

	})
})

function validateErrorSignupObject(err, message) {
	utils.assert.isDefined(err, "error was expected but was not found")
	utils.expect(err.toString()).to.have.string(message)
}

function validateSuccessfulSignupObject(data) {
	utils.assert.isDefined(data.userName, "userName property not defined in user response object")
	utils.assert.isDefined(data.psnId, "psnId property not defined in user response object")
	utils.assert.isDefined(data.clanId, "clanId property not defined in user response object")
	utils.assert.isDefined(data.imageUrl, "imageUrl property not defined in user response object")
	utils.assert.isDefined(data.date, "date property not defined in user response object")
	utils.assert.isDefined(data.uDate, "uDate property not defined in user response object")
	utils.assert.isDefined(data.clanId, "clanId property not defined in user response object")
}