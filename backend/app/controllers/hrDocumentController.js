const createCrudController = require('./crmCrudFactory');
const HrDocument = require('../models/hrDocument');

module.exports = createCrudController({
  model: HrDocument,
  entityType: 'hr_document',
  label: 'Documento de RH',
  requiredFields: ['candidateId', 'personName', 'documentType'],
  searchFields: ['personName', 'documentType', 'personType', 'status'],
});
