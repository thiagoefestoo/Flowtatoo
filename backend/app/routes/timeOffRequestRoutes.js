const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/timeOffRequestController');

module.exports = createCrudRoutes(controller);
