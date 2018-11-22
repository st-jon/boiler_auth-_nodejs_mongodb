const mongoose = require("mongoose")
const bcrypt = require('bcryptjs')
const validator = require('validator')

let UserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  lastname:{
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  username: {
    type: String,
    required: true,
    minlength: 1,
    unique: true,
    trim: true
  },
  email:{
    type: String,
    required: true,
    minlength: 1,
    unique: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: "{VALUE}, is not a valid email."
    }
  }, 
  password:{
    type: String,
    required: true,
    minlength: 8,
  },
})

UserSchema.statics.createUser = function (newUser, callback) {
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(newUser.password, salt, function(err, hash) {
	        newUser.password = hash
	        newUser.save(callback)
	    })
	})
}

UserSchema.statics.comparePassword = function (candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
    if (err) {
      console.log(err)
      res.sendStatus(500)
      return
    }
    	callback(null, isMatch)
	})
}


let User = mongoose.model("User", UserSchema)

module.exports = { User }