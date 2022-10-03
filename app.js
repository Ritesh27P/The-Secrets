require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const md5 = require("md5");
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/SecretUserDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


const User  = new mongoose.model('User', userSchema);


app.get('/', (req, res)=>{
    res.render(__dirname + '/views/home.ejs');
})

app.route('/login')
    .get( (req, res)=>{
        res.render(__dirname + '/views/login.ejs');
    })

    .post( (req, res)=>{
        const username = req.body.username;
        const userpassword = req.body.password;
        User.findOne({email: username}, (err, foundName)=>{
            if(foundName){
                console.log(foundName);
                bcrypt.compare(req.body.password, foundName.password, function(err, result) {
                    if(result === true){
                        res.render(__dirname + '/views/secrets');
                    }
                });
            }
        })

    })

app.route('/register')
    .get( (req, res)=>{
        res.render(__dirname + '/views/register.ejs');
    })

    .post( (req, res)=>{
        userEmail = req.body.username;
        userPassword = req.body.password;

        bcrypt.hash(userPassword, saltRounds).then(function(hash) {
            const newUser = new User({
                email: userEmail,
                password: hash
            });
                    newUser.save( (err)=>{
            if(err) console.log(err)
            else res.render(__dirname + '/views/secrets');
        });
        });
    })


app.listen(3000);
