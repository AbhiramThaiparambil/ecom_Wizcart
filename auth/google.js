require('dotenv').config();
const express = require('express');
const authRoute = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('../model/userModer');

let userBan = null;
let userProfile = null;

authRoute.use(passport.initialize());
authRoute.use(passport.session());

authRoute.get('/success', (req, res) => res.send(userProfile));
authRoute.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

passport.use(
  new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3200/signup/google/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log("Google profile", profile);
      
      let user = await User.findOne({
        email: profile.emails[0].value,
      });

      if (user) {
        userBan = user.is_ban;
      }

      if (!user) {
        user = new User({
          name: profile.name.givenName,
          googleId: profile.id,
          email: profile.emails[0].value,
          is_admin: 0,
          is_ban: 0 
        });
        await user.save();
        done(null, user);
      } else if (user.is_ban === 0) {
        done(null, user);
      } else {
        done(null, false, { message: 'User is banned' });
      }
    } catch (error) {
      done(error, null);
    }
  }
));

authRoute.get('/signup/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email']
  })
);

authRoute.get('/signup/google/callback', 
  passport.authenticate('google', { failureRedirect: '/user-block' }),
  (req, res) => {
    if (userBan == 1) {
      res.redirect('/user-block');
    } else {
      req.session.user_id = req.user.id;
      userProfile = req.user; // Set userProfile when user logs in
      res.redirect('/home');
    }
  }
);

module.exports = {
  authRoute
};
