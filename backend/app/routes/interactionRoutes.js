const createCrudRoutes = require('./crmRouteFactory');
const interactionController = require('../controllers/interactionController');

module.exports = createCrudRoutes(interactionController);
