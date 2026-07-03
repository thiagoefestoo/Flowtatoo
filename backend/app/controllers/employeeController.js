const createCrudController = require('./crmCrudFactory');
const Employee = require('../models/employee');

module.exports = createCrudController({
  model: Employee,
  entityType: 'employee',
  label: 'Colaborador',
  requiredFields: ['name', 'jobTitle'],
  searchFields: ['name', 'email', 'document', 'jobTitle', 'department', 'status'],
});
