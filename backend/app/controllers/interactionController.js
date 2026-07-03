const createCrudController = require('./crmCrudFactory');
const Interaction = require('../models/interaction');
const Customer = require('../models/customer');
const Lead = require('../models/lead');
const Opportunity = require('../models/opportunity');
const User = require('../models/user');

module.exports = createCrudController({
  model: Interaction,
  entityType: 'crm_interaction',
  label: 'interacao',
  requiredFields: ['subject'],
  searchFields: ['subject', 'content', 'nextStep'],
  include: [
    { model: Customer, as: 'customer', attributes: ['id', 'name', 'tradeName'] },
    { model: Lead, as: 'lead', attributes: ['id', 'name', 'company'] },
    { model: Opportunity, as: 'opportunity', attributes: ['id', 'title', 'stage', 'value'] },
    { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
  ],
});
