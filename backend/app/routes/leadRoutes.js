const createCrudRoutes = require('./crmRouteFactory');
const leadController = require('../controllers/leadController');

module.exports = createCrudRoutes(leadController);
