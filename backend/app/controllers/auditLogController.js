const { Op } = require('sequelize');

const AuditLog = require('../models/auditLog');
const User = require('../models/user');

async function getAllAuditLogs(req, res) {
  try {
    const { q, entityType, entityId, action, userId, dateFrom, dateTo } = req.query;

    const where = {};

    if (q) {
      where[Op.or] = [
        { description: { [Op.iLike]: `%${q}%` } },
        { action: { [Op.iLike]: `%${q}%` } },
        { entityType: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (entityId) where.entityId = entityId;

    if (dateFrom || dateTo) {
      where.createdAt = {};

      if (dateFrom) where.createdAt[Op.gte] = new Date(`${dateFrom}T00:00:00`);
      if (dateTo) where.createdAt[Op.lte] = new Date(`${dateTo}T23:59:59`);
    }

    const logs = await AuditLog.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 300,
    });

    return res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar auditoria.',
      error: error.message,
    });
  }
}

async function getAuditLogStats(req, res) {
  try {
    const total = await AuditLog.count();

    const compras = await AuditLog.count({
      where: { entityType: 'purchase' },
    });

    const produtos = await AuditLog.count({
      where: { entityType: 'product' },
    });

    const financeiros = await AuditLog.count({
      where: { entityType: 'financial' },
    });

    const clientes = await AuditLog.count({
      where: { entityType: 'customer' },
    });

    const fornecedores = await AuditLog.count({
      where: { entityType: 'supplier' },
    });

    const aprovacoes = await AuditLog.count({
      where: { action: 'purchase_approved' },
    });

    const reprovacoes = await AuditLog.count({
      where: { action: 'purchase_rejected' },
    });

    const baixasFinanceiras = await AuditLog.count({
      where: { action: 'financial_paid' },
    });
    const empresas = await AuditLog.count({
  where: { entityType: 'company' },
});

    return res.json({
      success: true,
      data: {
        total,
        compras,
        produtos,
        financeiros,
        clientes,
        fornecedores,
        empresas,
        aprovacoes,
        reprovacoes,
        baixasFinanceiras,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar estatisticas de auditoria.',
      error: error.message,
    });
  }
}

module.exports = {
  getAllAuditLogs,
  getAuditLogStats,
};