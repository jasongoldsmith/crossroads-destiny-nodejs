var mongoose = require('mongoose')
var Schema = mongoose.Schema

var sysConfigSchema = new Schema({
  key: {type: String, required: true},
  description:{type: String, required: true},
  value: {type: String, required: true}
})

sysConfigSchema.index({'key': 1}, {'unique': true})

module.exports = {
  schema: sysConfigSchema
}