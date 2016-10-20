var models = require('../models')

function createInvitation(data, callback) {
  models.eventInvitation.create(data, callback)
}

function deleteInvitation(eventInvitation, callback) {
  models.eventInvitation.delete(eventInvitation, callback)
}

module.exports = {
  createInvitation: createInvitation,
  deleteInvitation: deleteInvitation
}