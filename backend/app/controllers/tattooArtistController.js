const createCrudController = require('./crmCrudFactory');
const TattooArtist = require('../models/tattooArtist');

module.exports = createCrudController({
  model: TattooArtist,
  entityType: 'tattoo_artist',
  label: 'Tatuador',
  requiredFields: ['name'],
  searchFields: ['name', 'phone', 'email', 'instagram', 'specialties', 'status'],
  order: [['name', 'ASC']],
});
