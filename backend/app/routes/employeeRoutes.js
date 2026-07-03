const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/employeeController');

module.exports = createCrudRoutes(controller);
