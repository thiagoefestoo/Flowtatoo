const createCrudController = require('./crmCrudFactory');
const Candidate = require('../models/candidate');

module.exports = createCrudController({
  model: Candidate,
  entityType: 'candidate',
  label: 'Candidato',
  requiredFields: ['name'],
  searchFields: ['name', 'email', 'phone', 'desiredPosition', 'city', 'source', 'status', 'stage'],
});
