require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const md5 = require("md5");
const bcrypt = require('bcrypt');
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
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
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User  = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res)=>{
    res.render(__dirname + '/views/home.ejs');
})

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
