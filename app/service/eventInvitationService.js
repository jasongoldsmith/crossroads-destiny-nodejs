var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')


function createInvitation(data, callback) {
  models.eventInvitation.create(data, callback)
}

module.exports = {
  createInvitation: createInvitation
}