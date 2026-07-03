const createCrudController = require('./crmCrudFactory');
const OnboardingTask = require('../models/onboardingTask');

module.exports = createCrudController({
  model: OnboardingTask,
  entityType: 'onboarding_task',
  label: 'Tarefa de onboarding',
  requiredFields: ['employeeName', 'title'],
  searchFields: ['employeeName', 'title', 'responsibleName', 'status', 'category'],
});
