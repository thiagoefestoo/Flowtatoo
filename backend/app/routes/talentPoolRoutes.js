const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/talentPoolController');

module.exports = createCrudRoutes(controller);
