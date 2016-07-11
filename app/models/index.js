var user = require('./userModel')
var activity = require('./activityModel')
var event = require ('./eventModel')
var archiveEvent = require ('./archiveEventModel')
var installation = require('./installationModel')
var report =  require('./reportModel')
var notification = require('./notificationModel')
var notificationTrigger = require('./notificationTriggerModel')
var tinyUrl = require ('./tinyUrlModel')
var sysConfig = require('./sysConfigModel')
var userGroup = require('./userGroupModel')
module.exports = {
  user: user,
  activity: activity,
  event: event,
  installation: installation,
  archiveEvent: archiveEvent,
  report: report,
  notification: notification,
  notificationTrigger: notificationTrigger,
  tinyUrl: tinyUrl,
  sysConfig:sysConfig,
  userGroup:userGroup
}
