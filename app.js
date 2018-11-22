const express = require('express')
const mongoose = require('mongoose')

require('./models/User')
let UserSchema = require('mongoose').model('User').schema

const app = express()

mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true })

app.set('view engine','ejs')

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected to mongoDB')
})

const Users = mongoose.model('User', UserSchema)

let christophe = new Users({ firstname: 'christophe' })
console.log(christophe.firstname)

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.listen(3000, function () {
  console.log('App listening on port 3000!')
})