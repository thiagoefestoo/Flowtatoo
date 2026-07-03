const createCrudRoutes = require('./crmRouteFactory');
const controller = require('../controllers/tattooArtistController');

module.exports = createCrudRoutes(controller);
