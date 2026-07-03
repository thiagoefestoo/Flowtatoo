const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/terminationController');

module.exports = createCrudRoutes(controller);
