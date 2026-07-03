const createCrudController = require('./crmCrudFactory');
const createApprovalHandlers = require('./crmApprovalHelper');
const Campaign = require('../models/campaign');
const User = require('../models/user');

const include = [
  { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
];

const controller = createCrudController({
  model: Campaign,
  entityType: 'crm_campaign',
  label: 'campanha',
  requiredFields: ['name', 'document'],
  searchFields: ['name', 'document', 'notes'],
  include,
});

const approval = createApprovalHandlers({
  model: Campaign,
  include,
  entityType: 'crm_campaign',
  label: 'Campanha',
});

module.exports = {
  ...controller,
  ...approval,
};
