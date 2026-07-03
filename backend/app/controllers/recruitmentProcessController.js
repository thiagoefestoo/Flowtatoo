const createCrudController = require('./crmCrudFactory');
const RecruitmentProcess = require('../models/recruitmentProcess');

module.exports = createCrudController({
  model: RecruitmentProcess,
  entityType: 'recruitment_process',
  label: 'Processo seletivo',
  requiredFields: ['candidateId', 'candidateName', 'jobTitle'],
  searchFields: ['candidateName', 'jobTitle', 'recruiterName', 'stage', 'status'],
});
