var utils = require('../utils')
var models = require('../models')

function createReviewPromptCard(data, callback) {
  models.reviewPromptCard.createReviewPromptCard(data, callback)
}

function listReviewPromptCards(callback) {
  models.reviewPromptCard.listReviewPromptCards(callback)
}

function updateReviewPromptCard(data, callback) {
  models.reviewPromptCard.updateReviewPromptCard(data, callback)
}

function deleteReviewPromptCard(data, callback) {
  models.reviewPromptCard.deleteReviewPromptCard({_id: data.id}, callback)
}

module.exports = {
  createReviewPromptCard: createReviewPromptCard,
  listReviewPromptCards: listReviewPromptCards,
  updateReviewPromptCard: updateReviewPromptCard,
  deleteReviewPromptCard: deleteReviewPromptCard
}

