#!/usr/bin/env node

var express = require('express')
var router = express.Router()
var jobs = require('./jobs')

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
  default:
}