const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/tattooClientController');

module.exports = createCrudRoutes(controller);
