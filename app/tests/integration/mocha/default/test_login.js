var tUtils = require("../../../utils")
var utils = require("../../../../utils")
var cookie = require('cookie')
var expect = require('chai').expect
var helpers = require('../../../../helpers')
var assert = require('chai').assert
var mongoose = require('mongoose')

var gPhoneNo ="0000000000"

utils.l.i("-----------------------------------------------------------------------------------------------")
utils.l.i("*** LOGIN TEST CASES ***")
utils.l.i("-----------------------------------------------------------------------------------------------")
/*

describe("User Authentications Tests: ", function() {

	describe("Admin User: ", function () {
		var myCookies = {}

		it("Successful login", function (done) {
			tUtils.tPost(tUtils.baseURL,
				{path: "/api/v1/auth/login", data: {phoneNo: gPhoneNo}},
				{status: 200},
				function (err, res) {
					if (err) {
						if (err.status == 400) {
							// Admin user doesn't exist
							utils.l.i("-----------------------------------------------------------------------------------------------")
							utils.l.i("*** INITIAL ENVIRONMENT SETUP PROBLEM *** Please signup a user as admin with phone '0000000000'")
							utils.l.i("-----------------------------------------------------------------------------------------------")
						}
						return done(err)
					}

					myCookies = tUtils.getCookiesFromRes(res)
					expect(myCookies).to.have.property("connect.sid")
					expect(res.body).to.have.property("value")
					expect(res.body.value).to.not.equal(null)
					myName = res.body.value.name
					loggedInUserId = res.body.value._id
					done()
				})
		})

		it("Successful logout", function (done) {
			tUtils.tPost(tUtils.baseURL,
				{path: "/api/v1/auth/logout", data: {phoneNo: gPhoneNo}},
				{status: 200},
				function (err, res) {
					if (err) {
						return done(err)
					}

					myCookies = tUtils.getCookiesFromRes(res)
					expect(myCookies).to.have.property("connect.sid")
					done()
				})
		})
	})

	describe("Signup Random User Tests: ", function () {
		var randomUserPhone = utils.chance.phone()

		describe("Unsuccessful Tests: ", function () {
			it("First login for Random User should fail", function (done) {
				tUtils.tPost(tUtils.baseURL,
					{path: "/api/v1/auth/login", data: {phoneNo: randomUserPhone}},
					{status: 400},
					function (err) {
						if (err) {
							return done(err)
						}
						done()
					})
			})

			it("First signup for Random User should fail", function (done) {
				// test for gPhoneForOnboarding

				tUtils.tPost(tUtils.baseURL,
					{path: "/api/v1/auth/signup", data: {phoneNo: randomUserPhone, name: utils.chance.name()}},
					{status: 400},
					function (err, res) {
						if (err) {
							return done(err)
						}
						done()
					})
			})
			after( function() {
				mongoose.connection.collection('users').remove({phoneNo:utils.format.cleanNumber(randomUserPhone)})
			})
		})
	})
})*/
