const createCrudController = require('./crmCrudFactory');
const TimeOffRequest = require('../models/timeOffRequest');

module.exports = createCrudController({
  model: TimeOffRequest,
  entityType: 'time_off_request',
  label: 'Férias/Afastamento',
  requiredFields: ['employeeName', 'type', 'startDate', 'endDate'],
  searchFields: ['employeeName', 'type', 'status', 'approvedBy'],
});
