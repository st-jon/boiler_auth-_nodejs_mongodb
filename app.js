let bodyParser = require("body-parser")
let exphbs = require('express-handlebars')
let express = require('express')
let flash = require('connect-flash')
let LocalStrategy = require('passport-local').Strategy
let mongoose = require('mongoose')
let passport = require('passport')
let session = require('express-session')
let validator = require('validator')

let {User} = require('./models/User')

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
          return done(null, user)
        } else {
          return done(null, false, { message: 'Invalid password' })
        }
      })
    })
  }
))

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user)
  })
})

app.get('/', (req, res) => {
  res.render('index', {success: req.flash('success')})
})

app.get('/login', (req, res) => {
  res.render('login', {error: req.flash('error'), message: req.flash('message')})
})

app.post('/login', passport.authenticate('local', { 
  successRedirect: '/',
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

  let newUser = new User({
    username: username,
    firstname: firstname,
    lastname: lastname,
    email: email,
    password: password
  })
  
  
  User.createUser(newUser, (err, user) => {
    if(user) {
      req.flash('message', `Hi ${user.username}! You are registered`)
      res.redirect('/login')
    }
    if (err) {
      if(err.code === 11000) {
        req.flash('message', 'Username already used')
        res.redirect('/register')
      } 
    }
    
  })
})

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

app.set('port', (process.env.PORT || 3000))

app.listen(app.get('port'), () => {
	console.log(`Server started on port ${app.get('port')}`)
})