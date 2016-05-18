var routeUtils = require('../routes/routeUtils')
var utils = require('../utils')
var admin = require('../controllers/admin')

module.exports = function (app, passport) {
  app.get('/', function(req, res) {
    res.render('index')
  })

  app.use('/api/v1/auth', require('../routes/v1/auth'))
  app.use('/api/v1/activity', require('../routes/v1/activity'))
  app.use('/api/v1/notification', require('../routes/v1/notification'))
  app.use('/api/v1/notificationTrigger', require('../routes/v1/notificationTrigger'))
  app.use('/api/v1/a/event', require('../routes/v1/a/event'))
  app.use('/api/v1/a/user', require('../routes/v1/a/users'))
  app.use('/api/v1/a/installation', require('../routes/v1/a/installation'))
  app.use('/api/v1/appVersion', require('../routes/v1/appVersion'))
  app.use('/api/v1/a/messages', require('../routes/v1/a/messages'))
  app.use('/api/v1/a/report', require('../routes/v1/a/report'))
  app.use('/api/v1/a/account', require('../routes/v1/a/account'))
  app.use('/api/v1/a/mixpanel', require('../routes/v1/a/mixPanelDataTracking'))

  /// catch 404 and forward to error handler
  app.use(function(req, res, next) {
    routeUtils.handleAPINotFound(req, res)
  })

  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    utils.l.sentryError(err)
    res.status(err.status || 500)
    routeUtils.handleAPIError(req, res, err)
  })

}