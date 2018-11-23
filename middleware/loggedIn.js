let flash = require('connect-flash')

let loggedIn = (req, res, next) => {
  if (req.user) {
      next()
  } else {
    req.flash('message', 'You have to log in to view this page')
    res.redirect('/')
  }
}
module.exports = { loggedIn }