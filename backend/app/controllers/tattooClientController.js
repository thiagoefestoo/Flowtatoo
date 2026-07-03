const createCrudController = require('./crmCrudFactory');
const TattooClient = require('../models/tattooClient');

module.exports = createCrudController({
  model: TattooClient,
  entityType: 'tattoo_client',
  label: 'Cliente do estúdio',
  requiredFields: ['name', 'phone'],
  searchFields: ['name', 'phone', 'whatsapp', 'email', 'instagram', 'city', 'source', 'status'],
  order: [['createdAt', 'DESC']],
});
