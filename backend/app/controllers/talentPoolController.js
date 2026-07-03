const createCrudController = require('./crmCrudFactory');
const TalentPool = require('../models/talentPool');

module.exports = createCrudController({
  model: TalentPool,
  entityType: 'talent_pool',
  label: 'Banco de talentos',
  requiredFields: ['candidateId', 'candidateName', 'area'],
  searchFields: ['candidateName', 'email', 'phone', 'area', 'level', 'status'],
});
