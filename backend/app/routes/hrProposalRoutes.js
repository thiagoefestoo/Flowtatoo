const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/hrProposalController');

module.exports = createCrudRoutes(controller);
