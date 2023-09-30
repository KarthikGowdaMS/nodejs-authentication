require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
// const md5=require('md5');  //level 3
// const bcrypt = require('bcrypt');  //level 4
const session = require('express-session'); //level 5
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

// const saltRounds = 10;
const port = process.env.PORT || 3000;
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true });


const userSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    password: {
        type: String,
    },
    googleId: String,
    secret: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets/",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo/"
},
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/submit', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('submit');
    }
    else {
        res.render('login');
    }
});

app.get('/secrets', async (req, res) => {

    const users = await User.find({ "secret": { $ne: null } });

    if (users) {
        res.render("secrets", { userswithsecrets: users });
    }
    else {
        res.render("secrets", { userswithsecrets: '' });
    } // if (req.isAuthenticated()) {
    //     res.render('secrets');
    // }
    // else {
    //     res.render('login');
    // }
});

app.get('/logout', (req, res) => {
    req.logOut(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.post('/register', async (req, res) => {

    // const username = req.body.username;
    // const password = req.body.password;

    // const newUser = new User({
    //     username: username,
    //     password: password
    // });
    // await newUser.save();

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect('/register');
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect('/secrets');
            });

        }
    });

})

app.post('/login', async (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect('/secrets');
            });

        }
    })

    // if (user) {
    //     if (user.password === password) {
    //         res.render('secrets');
    //     }
    //     else {
    //         res.send('Invalid Password');
    //     }
    // }

    // else {
    //     res.send('User not found');
    // }

});

app.post('/submit', async (req, res) => {
    const secret = req.body.secret;
    // console.log(req.user.id);

    const user = await User.findById(req.user.id);
    if (user) {
        user.secret = secret;
        user.save();
        res.redirect('/secrets');
    }


});

app.listen(port, () => {
    console.log(`server running at port ${port}`);
});


// bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
//     const username = req.body.username;
//     const password = hash;

//     const newUser = new User({
//         username: username,
//         password: password
//     });


// Load hash from your password DB.
// bcrypt.compare(password, user.password, function (err, result) {
//     if (result === true) {
//         res.render('secrets');
//     }
//     else {
//         res.send('Invalid Password');
//     }
// });