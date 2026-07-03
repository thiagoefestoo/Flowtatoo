const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/recruitmentProcessController');

module.exports = createCrudRoutes(controller);
