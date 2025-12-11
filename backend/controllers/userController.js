/**
 * User Controller Module
 * Re-exports controllers from profile, skills, and dashboard modules
 * @module controllers/userController
 */

const profileController = require('./profileController');
const skillsController = require('./skillsController');
const dashboardController = require('./dashboardController');

module.exports = {
  // Profile controllers
  ...profileController,
  // Skills controllers
  ...skillsController,
  // Dashboard controllers
  ...dashboardController,
};
