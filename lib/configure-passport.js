const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  BasicStrategy = require('passport-http').BasicStrategy,
  expressSession = require('express-session'),
  bcrypt = require('bcrypt-nodejs'),
  uuid = require('node-uuid'),
  config = require('../config/config'),
  User = require('../models/user');

const cookieConfig = {
  cookie: {
    secure: false,
    httpOnly: false
  },
  secret: config.SESSION_SECRET
};

const isValidPassword = function(user, password) {
  return bcrypt.compareSync(password, user.password);
};

const createHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
};

const configurePassport = function(app) { 
  app.use(expressSession(cookieConfig));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser((id, done) =>
    User.findById(id).then((user) => done(null, user), (error) => done(error, null))
  );

  passport.use('login', new LocalStrategy({
      passReqToCallback: true  
    },
    (req, username, password, done) => 
      User.find({ limit: 1, where: { username: username }}).then(
      (user) => {
        if (user === null) {
          return done(null, false, req.flash('message', 'User not found'));
        }
        if (!isValidPassword(user, password)) {
          return done(null, false, req.flash('message', 'Invalid password'));
        }
        return done(null, user);
      },
      (error) => done(error)
    )
  ));

  passport.use('signup', new LocalStrategy({
    passReqToCallback: true
  },
  (req, username, password, done) => 
    User.find({ limit: 1, where: { username: username}}).then(
      (user) => { 
        if (user) {
          return done(null, false, req.flash('message' , 'User already exists'));
        }
        User.create({
          username: username,
          email: req.body.email,
          apiKey: uuid.v4(),
          apiSecret: uuid.v4(),
          password: createHash(password) 
        }).then(
          (newUser) => done(null, newUser),
          (error) => done(error)
        );
      },
      (error) => done(error)
    )
  ));

  passport.use('api', new BasicStrategy(
    (apiKey, apiSecret, done) =>
      User.find({ limit: 1, where: { apiKey: apiKey }}).then(
          (user) => {
            if (user === null) {
                return done(null, false);
            }
            if (user.apiSecret !== apiSecret) {
                return done(null, false);
            }
            return done(null, user);
          },
          (error) => done(error)
      )
  ));
};

module.exports = configurePassport;
