var express = require('express');
var path = require('path');
var morgan = require('morgan');
var db = require('./db');

var session = require('express-session'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser');

var mongoStore = require('connect-mongo')(session);

var compression = require('compression');

var flash = require('connect-flash');
var methodOverride = require('method-override');

var utils = require('../utils');

var middlewares = require('./middlewares');

var routeUtils = require('../routes/routeUtils');
var models = require('../models')

module.exports = function (app, passport) {
  app.use(compression({
    threshold: 512
  }));

  utils.config.show();

  app.use(middlewares.handleReqCleanup());

  app.use(middlewares.forceSSL());

  app.set('views', path.join(utils.config.root, 'views'));

  app.set('view engine', 'ejs');

  app.use(express.static(__dirname + '/../'+'views'));

  app.use(morgan('combined'));

  app.use(cookieParser());

  // bodyParser should be above methodOverride
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  }));

  require('./validator')(app);

  // express/mongo session storage
  app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'met8yeIsh1Ed4kUv5sUt2veV2Ec2Oib6cUd0Kop5Cu8Ve5ghij',
    cookie: {
      maxAge: 126144000000
    },
    store: new mongoStore({
      mongooseConnection: db.connection,
      collection: 'sessions'
    })
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // connect flash for flash messages - should be declared after sessions
  app.use(flash());

  app.use('/api/v1/a', function(req, res, next) {
    //utils.l.i("req in /api/v1/a", {path: req.path, headers: req.headers, body: req.body, files:req.files});

    if (!req.isAuthenticated()) {
      return routeUtils.handleAPIUnauthorized(req, res)
    }else{
      var userLastActiveUpdateInterval = utils.config.userLastActiveUpdateInterval
      var timeDiff = utils.moment().utc().diff(req.user.lastActiveTime, 'minutes')
      utils.l.d("expressStartup::timeDiff::"+timeDiff+"::lastActiveTime::"+req.user.lastActiveTime+"::userLastActiveUpdateInterval::"+userLastActiveUpdateInterval)
      if(timeDiff > userLastActiveUpdateInterval){
        models.user.findByUserIdAndUpdate(req.user.id, {
          lastActiveTime: new Date(),
          notifStatus: []
        }, function (err, user) {
          if (err) {
            utils.l.d("error in the authenticated API request", err)
            utils.l.d("error in the authenticated API request for user", user)
          }
          next();
        });
      }else next();
    }
    //if (!req.user.isNormal()) {
    //  return res.redirect('/');
    //}

  });
  app.use(middlewares.visitTracker());

  app.use(middlewares.identifyUser());
};
