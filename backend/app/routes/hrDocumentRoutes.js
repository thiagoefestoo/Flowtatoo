const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/hrDocumentController');

module.exports = createCrudRoutes(controller);
