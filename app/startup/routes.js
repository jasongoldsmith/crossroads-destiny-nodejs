var routeUtils = require('../routes/routeUtils');
var utils = require('../utils');
var admin = require('../controllers/admin');

module.exports = function (app, passport) {
  app.get('/', function(req, res) {
    res.render('index');
  });



  app.use('/api/v1/auth', require('../routes/v1/auth'));
  app.use('/api/v1/activity', require('../routes/v1/activity'))
  app.use('/api/v1/a/event', require('../routes/v1/a/event'))

  /// catch 404 and forward to error handler
  app.use(function(req, res, next) {
    routeUtils.handleAPINotFound(req, res);
  });

  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    utils.l.sentryError(err);
    res.status(err.status || 500);
    routeUtils.handleAPIError(req, res, err);
  });

};