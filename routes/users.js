const express = require('express'),
  passport = require('passport');

let router = express.Router();

/* GET users listing. */

router.get('/login', (req, res, next) => res.render('login'));

router.post('/login', passport.authenticate('login', {
  successRedirect: '/',
  failureRedirect: '/',
  failureFlash: true
}));

router.get('/signup', (req, res, next) => res.render('signup'));
router.post('/signup', passport.authenticate('signup', {
  successRedirect: '/',
  failureRedirect: '/',
  failureFlash: true
}));

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
