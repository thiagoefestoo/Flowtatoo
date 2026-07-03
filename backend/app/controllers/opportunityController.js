const createCrudController = require('./crmCrudFactory');
const createApprovalHandlers = require('./crmApprovalHelper');
const Opportunity = require('../models/opportunity');
const Customer = require('../models/customer');
const Lead = require('../models/lead');
const User = require('../models/user');

const include = [
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'tradeName', 'email', 'phone'] },
  { model: Lead, as: 'lead', attributes: ['id', 'name', 'company', 'email', 'phone'] },
  { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
];

const controller = createCrudController({
  model: Opportunity,
  entityType: 'crm_opportunity',
  label: 'oportunidade',
  requiredFields: ['title', 'document'],
  searchFields: ['title', 'document', 'source', 'description', 'lostReason'],
  include,
});

const approval = createApprovalHandlers({
  model: Opportunity,
  include,
  entityType: 'crm_opportunity',
  label: 'Oportunidade',
});

module.exports = {
  ...controller,
  ...approval,
};
