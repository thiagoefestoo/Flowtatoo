const createCrudController = require('./crmCrudFactory');
const Lead = require('../models/lead');
const User = require('../models/user');

module.exports = createCrudController({
  model: Lead,
  entityType: 'crm_lead',
  label: 'lead',
  requiredFields: ['name'],
  searchFields: ['name', 'company', 'email', 'phone', 'segment', 'interest'],
  include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
});
