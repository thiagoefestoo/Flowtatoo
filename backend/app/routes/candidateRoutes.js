const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/candidateController');

module.exports = createCrudRoutes(controller);
