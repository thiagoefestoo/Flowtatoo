const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/interviewController');

module.exports = createCrudRoutes(controller);
