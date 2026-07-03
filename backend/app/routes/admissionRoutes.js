const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/admissionController');

module.exports = createCrudRoutes(controller);
