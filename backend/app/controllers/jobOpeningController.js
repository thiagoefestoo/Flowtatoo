const createCrudController = require('./crmCrudFactory');
const JobOpening = require('../models/jobOpening');

module.exports = createCrudController({
  model: JobOpening,
  entityType: 'job_opening',
  label: 'Vaga',
  requiredFields: ['title', 'department'],
  searchFields: ['code', 'title', 'department', 'location', 'recruiterName', 'managerName', 'status'],
});
