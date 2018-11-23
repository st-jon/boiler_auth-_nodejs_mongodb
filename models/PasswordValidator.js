var passwordValidator = require('password-validator');
 
// Create a schema
let PasswordValidator = new passwordValidator();
 
// Add properties to it
PasswordValidator
.is().min(8)                                    // Minimum length 8
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits()                                 // Must have digits
.has().not().spaces()                           // Should not have spaces

module.exports = { PasswordValidator }