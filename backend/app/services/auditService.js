const AuditLog = require('../models/auditLog');

async function registerAuditLog({
  entityType,
  entityId,
  action,
  description,
  userId,
  metadata = null,
  transaction = null,
}) {
  return AuditLog.create(
    {
      entityType,
      entityId,
      action,
      description,
      userId,
      metadata,
    },
    transaction ? { transaction } : undefined
  );
}

module.exports = {
  registerAuditLog,
};