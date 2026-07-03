async function registerAuditLog(payload) {
  if (process.env.AUDIT_ENABLED !== 'true') return null;

  // Carrega o modelo apenas quando a auditoria estiver habilitada.
  const AuditLog = require('../models/auditLog');

  return AuditLog.create(
    {
      entityType: payload.entityType,
      entityId: payload.entityId,
      action: payload.action,
      description: payload.description,
      userId: payload.userId,
      metadata: payload.metadata ?? null,
    },
    payload.transaction ? { transaction: payload.transaction } : undefined
  );
}

module.exports = {
  registerAuditLog,
};
