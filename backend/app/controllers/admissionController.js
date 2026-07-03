const createCrudController = require('./crmCrudFactory');
const Admission = require('../models/admission');

module.exports = createCrudController({
  model: Admission,
  entityType: 'admission',
  label: 'Admissão',
  requiredFields: ['candidateId', 'employeeName', 'jobTitle'],
  searchFields: ['employeeName', 'jobTitle', 'department', 'status'],
});
