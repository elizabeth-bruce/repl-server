const http = require('http'),
    fs = require('fs'),
    express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    expressSession = require('express-session'),
    redisStore = require('connect-redis')(expressSession),
    bodyParser = require('body-parser'),
    addCloseHandler = require('./lib/close-handler'),
    config = require('./config/config');

let app = express();
let server = http.createServer(app);

let wsExpress = require('express-ws')(app, server);

addCloseHandler(server);

const sessions = require('./routes/sessions');

const sessionStore = new redisStore();

const sessionConfig = {
    cookie: {
      secure: false,
      httpOnly: false
    },
    store: sessionStore,
    secret: app.get('env') === 'development' ? config.SESSION_SECRET : fs.readFileSync('session-secret.txt', 'utf8'),
    resave: false,
    saveUninitialized: true
};

app.use(expressSession(sessionConfig));

if (app.get('env') === 'development') {
    app.use(logger('dev'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.use('*', (req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use('/sessions', sessions);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
        console.log(err);
        res.status(err.status || 500).send({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
    res.status(err.status || 500).send({
        message: err.message,
        error: {}
    });
});

module.exports = {
    app: app,
    server: server
};
