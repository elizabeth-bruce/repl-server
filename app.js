const http = require('http'), 
    express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    expressSession = require('express-session'),
    bodyParser = require('body-parser'),
    addCloseHandler = require('./lib/close-handler'),
    config = require('./config/config');

let app = express();
let server = http.createServer(app);

let wsExpress = require('express-ws')(app, server);

const routes = require('./routes/index'),
    users = require('./routes/users'),
    sessions = require('./routes/sessions');

const cookieConfig = {
    cookie: {
      secure: false,
      httpOnly: false
    },
    secret: config.SESSION_SECRET
};

addCloseHandler(server);
app.use(expressSession(cookieConfig));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('*', (req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use('/sessions', sessions);
app.use('/users', users);
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    console.log(err);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = {
    app: app,
    server: server
};
