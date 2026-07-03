const createCrudController = require('./crmCrudFactory');
const Interview = require('../models/interview');

module.exports = createCrudController({
  model: Interview,
  entityType: 'interview',
  label: 'Entrevista',
  requiredFields: ['candidateId', 'candidateName', 'jobTitle', 'interviewerName', 'scheduledAt'],
  searchFields: ['candidateName', 'jobTitle', 'interviewerName', 'status', 'result'],
});
