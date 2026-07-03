const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/onboardingTaskController');

module.exports = createCrudRoutes(controller);
