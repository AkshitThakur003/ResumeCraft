/**
 * Resume Controller Module
 * Re-exports controllers from upload, list, and analysis modules
 * @module controllers/resumeController
 */

const resumeUploadController = require('./resumeUploadController');
const resumeListController = require('./resumeListController');
const resumeAnalysisController = require('./resumeAnalysisController');

module.exports = {
  // Upload controllers
  ...resumeUploadController,
  // List controllers
  ...resumeListController,
  // Analysis controllers
  ...resumeAnalysisController,
};
