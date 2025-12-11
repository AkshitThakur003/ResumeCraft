/**
 * Auth Controller Module
 * Re-exports controllers from authentication, password, email, and oauth modules
 * @module controllers/authController
 */

const authenticationController = require('./authenticationController');
const passwordController = require('./passwordController');
const emailController = require('./emailController');
const oauthController = require('./oauthController');

module.exports = {
  // Authentication controllers
  ...authenticationController,
  // Password controllers
  ...passwordController,
  // Email controllers
  ...emailController,
  // OAuth controllers
  ...oauthController,
};
