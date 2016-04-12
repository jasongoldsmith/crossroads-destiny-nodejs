#!/usr/bin/env node

var express = require('express')
var router = express.Router()
var jobs = require('./jobs')
var utils = require('./app/utils')

var hashPassword = "hashPassword"
var deleteOldFullEvents = "deleteOldFullEvents"


var command = process.argv[2]


switch(command) {
  case hashPassword:
    jobs.updatePassWord()
    break
  case deleteOldFullEvents:
    jobs.deleteOldFullEvents()
    break
  case "momentTest":
    console.log("time: "+utils.moment().add(-utils.config.triggerIntervalMinutes,"minutes").format())
  default:
}