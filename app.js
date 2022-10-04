require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const md5 = require("md5");
const bcrypt = require('bcrypt');
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const saltRounds = 10;

const app = express();

app.use(session({
    secret: "this is our little secret",
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/SecretUserDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User  = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      console.log(err);
      return cb(err, user);
    });
  }
));



app.get('/', (req, res)=>{
    res.render(__dirname + '/views/home.ejs');
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.route('/login')
    .get( (req, res)=>{
        res.render(__dirname + '/views/login.ejs');
    })


app.post("/login", passport.authenticate("local",{
    successRedirect: "/secrets",
    failureRedirect: "/login"
}), function(req, res){
    
});

app.route('/register')
    .get( (req, res)=>{
        res.render(__dirname + '/views/register.ejs');
    })

    .post( (req, res)=>{
        const newUser = req.body.username;

        User.register({username: newUser}, req.body.password , function(err,user){
            if(err){console.log(err); res.redirect("/register")}
            else{
              //A new user was saved
              passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
              })
            }
          })
    })


app.get('/secrets', (req, res)=>{
    if(req.isAuthenticated()){
        res.render(__dirname + '/views/secrets');
    } else {
        res.redirect('/')
        // res.send('You are not allowed here without authentication!')
    }
})


app.get('/logout', (req, res)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
})

app.listen(3000);
