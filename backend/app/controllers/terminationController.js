const createCrudController = require('./crmCrudFactory');
const Termination = require('../models/termination');

module.exports = createCrudController({
  model: Termination,
  entityType: 'termination',
  label: 'Desligamento',
  requiredFields: ['employeeName'],
  searchFields: ['employeeName', 'jobTitle', 'type', 'status'],
});
