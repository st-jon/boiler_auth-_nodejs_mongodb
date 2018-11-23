let bodyParser = require("body-parser")
let exphbs = require('express-handlebars')
let express = require('express')
let FacebookStrategy = require('passport-facebook').Strategy
let flash = require('connect-flash')
let LocalStrategy = require('passport-local').Strategy
let mongoose = require('mongoose')
let passport = require('passport')
const path = require('path')
let session = require('express-session')

require('dotenv').config()


let {User} = require('./models/User')
let {PasswordValidator} = require('./models/PasswordValidator')
let {loggedIn} = require('./middleware/loggedIn')

const APP_ID = process.env.APP_ID
const KEY = process.env.KEY

const app = express()

app.use(session({
  secret: 'fdkjhsfUYTIUYbjdf',
  resave: false,
  saveUninitialized: true,
}))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.engine('.hbs', exphbs({defaultLayout: 'main'}))
app.set('view engine', '.hbs')

app.use(express.static(path.join(__dirname, 'public')))

mongoose.connect('mongodb://localhost/user', { useNewUrlParser: true })
mongoose.set('useCreateIndex', true)

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected to mongoDB')
})

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({$or: [{ username: username }, {email: username}]}, (err, user) => {
      if (err) {
        console.log(err)
        res.sendStatus(500)
        return
      }
      if (!user.password) {
        return done(null, false, { message: `${user.username}, must login using facebook` })
      }
      if (!user) {
        return done(null, false, { message: 'Incorrect username' })
      }
      User.comparePassword(password, user.password, function (err, isMatch) {
        if (err) {
          console.log(err)
          res.sendStatus(500)
          return
        }
        if (isMatch) {
          return done(null, user, {message: `Hi ${user.username} ! Welcome` })
        } else {
          return done(null, false, { message: 'Invalid password' })
        }
      })
    })
  }
))

passport.use(new FacebookStrategy({
  clientID: APP_ID,
  clientSecret: KEY,
  callbackURL: "http://localhost:3000/auth/facebook/callback",
  profileFields: ['id', 'emails', 'name']
},
function(accessToken, refreshToken, profile, done) {
  User.findOne( {"facebook.id": profile.id}, function(err, user) {
    if (err) done(err) 
    if (user) done(null, user, {message: `Hi ${user.username} ! Welcome` })
    if (!user) {
      let newUser = new User({
          username: `${profile._json.first_name} ${profile._json.last_name}`,
          firstname: profile._json.first_name,
          lastname: profile._json.last_name,
          email: profile.emails[0].value,
          facebook: {
            id: profile.id,
          }
        })
        User.createUser(newUser, (err, user) => {
          if(user) {
            return done(null, user, {message: `Hi ${user.username} ! You are registered` })
          }
        })
      }
    })
  }
))

app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email'] }))

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { 
    successRedirect: '/success',
    failureRedirect: '/login',
    failureFlash: true,
    successFlash: true }))

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user)
  })
})

app.get('/', (req, res) => {
  res.render('index', {success: req.flash('success'), message: req.flash('message')})
})

app.get('/login', (req, res) => {
  res.render('login', {error: req.flash('error'), message: req.flash('message')})
})

app.post('/login', passport.authenticate('local', { 
  successRedirect: '/success',
  failureRedirect: '/login',
  failureFlash: true,
  successFlash: true
  })
)

app.get('/register', (req, res) => {
  res.render('register', {message: req.flash('message')})
})

app.post('/register', (req, res) => {
  let username= req.body.username
  let firstname = req.body.firstname
  let lastname = req.body.lastname
	let email = req.body.email
	let password = req.body.password
  let confirm = req.body.confirm

  let validation = PasswordValidator.validate(password, { list: true })

  if (validation.includes('min')) {
    req.flash('message', 'Password must be at least 8 characters')
    res.redirect('/register')
    return
  } else if (validation.includes('uppercase')) {
    req.flash('message', 'Password must contains uppercase character')
    res.redirect('/register')
    return
  } else if (validation.includes('lowercase')) {
    req.flash('message', 'Password must contains lowercase character')
    res.redirect('/register')
    return
  } else if (validation.includes('digits')) {
    req.flash('message', 'Password must contains at least one digit')
    res.redirect('/register')
    return
  } else if (validation.includes('spaces')){
    req.flash('message', 'Password cannot have space inside')
    res.redirect('/register')
    return
  } 

  if (password === confirm) {
    let newUser = new User({
      username: username,
      firstname: firstname,
      lastname: lastname,
      email: email,
      password: password
    })
    
    User.createUser(newUser, (err, user) => {
      if(user) {
        req.flash('message', `Hi ${user.username} ! You are registered`)
        res.redirect('/login')
      }
      if (err) {
        if(err.code === 11000) {
          req.flash('message', 'Username already used')
          res.redirect('/register')
        } 
      }
    })
  } else {
    req.flash('message', 'Please confirm password')
    res.redirect('/register')
  }
})

app.get('/success', loggedIn, (req, res) => {
  res.render('success', {success: req.flash('success')})
})

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

app.set('port', (process.env.PORT || 3000))

app.listen(app.get('port'), () => {
	console.log(`Server started on port ${app.get('port')}`)
})