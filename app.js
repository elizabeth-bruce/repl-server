const http = require('http'), 
    express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    addCloseHandler = require('./lib/close-handler'),
    configurePassport = require('./lib/configure-passport');

let app = express();
let server = http.createServer(app);

let wsExpress = require('express-ws')(app, server);

const routes = require('./routes/index'),
    users = require('./routes/users'),
    sessions = require('./routes/sessions');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

addCloseHandler(server);
configurePassport(app);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

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
