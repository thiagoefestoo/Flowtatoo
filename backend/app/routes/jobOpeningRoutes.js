const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/jobOpeningController');

module.exports = createCrudRoutes(controller);
