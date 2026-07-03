const createCrudController = require('./crmCrudFactory');
const HrProposal = require('../models/hrProposal');

module.exports = createCrudController({
  model: HrProposal,
  entityType: 'hr_proposal',
  label: 'Proposta',
  requiredFields: ['candidateId', 'candidateName', 'jobTitle'],
  searchFields: ['candidateName', 'jobTitle', 'status', 'contractType'],
});
