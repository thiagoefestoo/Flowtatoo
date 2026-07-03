const createCrudController = require('./crmCrudFactory');
const createApprovalHandlers = require('./crmApprovalHelper');
const Proposal = require('../models/proposal');
const Customer = require('../models/customer');
const Opportunity = require('../models/opportunity');
const User = require('../models/user');

const include = [
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'tradeName', 'email', 'phone'] },
  { model: Opportunity, as: 'opportunity', attributes: ['id', 'title', 'stage', 'value'] },
  { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
];

const controller = createCrudController({
  model: Proposal,
  entityType: 'crm_proposal',
  label: 'proposta',
  requiredFields: ['number', 'title', 'document'],
  searchFields: ['number', 'title', 'document', 'description', 'paymentTerms', 'scope'],
  include,
});

const approval = createApprovalHandlers({
  model: Proposal,
  include,
  entityType: 'crm_proposal',
  label: 'Proposta',
});

module.exports = {
  ...controller,
  ...approval,
};
