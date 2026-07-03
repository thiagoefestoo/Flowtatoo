const { Op } = require('sequelize');

const Supplier = require('../models/supplier');
const { registerAuditLog } = require('../services/auditService');

function buildSupplierMetadata(supplier) {
  return {
    name: supplier.name,
    tradeName: supplier.tradeName,
    document: supplier.document,
    type: supplier.type,
    email: supplier.email,
    phone: supplier.phone,
    contactName: supplier.contactName,
    city: supplier.city,
    state: supplier.state,
    category: supplier.category,
    paymentTerms: supplier.paymentTerms,
    status: supplier.status,
  };
}

async function getAllSuppliers(req, res) {
  try {
const { q, type, status, category, approvalStatus } = req.query;

    const where = {};

    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { tradeName: { [Op.iLike]: `%${q}%` } },
        { document: { [Op.iLike]: `%${q}%` } },
        { city: { [Op.iLike]: `%${q}%` } },
        { category: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (category) where.category = category;
    if (approvalStatus) {
  where.approvalStatus = approvalStatus;
}

    const suppliers = await Supplier.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar fornecedores.',
      error: error.message,
    });
  }
}

async function getSupplierStats(req, res) {
  try {
    const total = await Supplier.count();
    const ativos = await Supplier.count({ where: { status: 'ativo' } });
    const inativos = await Supplier.count({ where: { status: 'inativo' } });
    const bloqueados = await Supplier.count({ where: { status: 'bloqueado' } });
    const pessoaFisica = await Supplier.count({ where: { type: 'pessoa_fisica' } });
    const pessoaJuridica = await Supplier.count({ where: { type: 'pessoa_juridica' } });
const pendentesAprovacao = await Supplier.count({
  where: {
    approvalStatus: 'pendente',
  },
});

const aprovados = await Supplier.count({
  where: {
    approvalStatus: 'aprovado',
  },
});

const reprovados = await Supplier.count({
  where: {
    approvalStatus: 'reprovado',
  },
});
    return res.json({
      success: true,
data: {
  total,
  ativos,
  inativos,
  bloqueados,
  pessoaFisica,
  pessoaJuridica,
  pendentesAprovacao,
  aprovados,
  reprovados,
},
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar estatisticas de fornecedores.',
      error: error.message,
    });
  }
}

async function getSupplierById(req, res) {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fornecedor nao encontrado.',
      });
    }

    return res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar fornecedor.',
      error: error.message,
    });
  }
}
function buildSupplierMetadata(supplier) {
  return {
    name: supplier.name,
    tradeName: supplier.tradeName,
    document: supplier.document,
    type: supplier.type,
    email: supplier.email,
    phone: supplier.phone,
    contactName: supplier.contactName,
    city: supplier.city,
    state: supplier.state,
    category: supplier.category,
    paymentTerms: supplier.paymentTerms,
    status: supplier.status,
    approvalStatus: supplier.approvalStatus,
  };
}
async function createSupplier(req, res) {
  try {
    const { name, tradeName, document } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Informe o nome ou razao social do fornecedor.',
      });
    }

    if (document) {
      const existingSupplier = await Supplier.findOne({
        where: {
          document: document.trim(),
        },
      });

      if (existingSupplier) {
        return res.status(409).json({
          success: false,
          message: 'Ja existe um fornecedor com este documento.',
        });
      }
    }

const supplier = await Supplier.create({
  ...req.body,
  name: name.trim(),
  tradeName: tradeName ? tradeName.trim() : null,
  document: document ? document.trim() : null,
  status: 'bloqueado',
  approvalStatus: 'nao_enviado',
});

    await registerAuditLog({
      entityType: 'supplier',
      entityId: supplier.id,
      action: 'supplier_created',
      description: `Fornecedor ${supplier.name} criado.`,
      userId: req.userId,
      metadata: buildSupplierMetadata(supplier),
    });
await registerAuditLog({
  entityType: 'supplier',
  entityId: supplier.id,
  action: 'supplier_created',
  description: `Fornecedor "${supplier.name}" criado aguardando aprovação.`,
  userId: req.userId,
  metadata: buildSupplierMetadata(supplier),
});
    return res.status(201).json({
      success: true,
      message: 'Fornecedor criado como bloqueado. Envie para aprovação antes de ativar.',
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar fornecedor.',
      error: error.message,
    });
  }
}

async function updateSupplier(req, res) {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fornecedor nao encontrado.',
      });
    }

    const previousData = buildSupplierMetadata(supplier);

    const { name, tradeName, document } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Informe o nome ou razao social do fornecedor.',
      });
    }

    if (document) {
      const existingSupplier = await Supplier.findOne({
        where: {
          document: document.trim(),
          id: {
            [Op.ne]: supplier.id,
          },
        },
      });

      if (existingSupplier) {
        return res.status(409).json({
          success: false,
          message: 'Ja existe outro fornecedor com este documento.',
        });
      }
    }

    await supplier.update({
      ...req.body,
      name: name.trim(),
      tradeName: tradeName ? tradeName.trim() : null,
      document: document ? document.trim() : null,
    });

    await registerAuditLog({
      entityType: 'supplier',
      entityId: supplier.id,
      action: 'supplier_updated',
      description: `Fornecedor ${supplier.name} atualizado.`,
      userId: req.userId,
      metadata: {
        before: previousData,
        after: buildSupplierMetadata(supplier),
      },
    });

    return res.json({
      success: true,
      message: 'Fornecedor atualizado com sucesso.',
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar fornecedor.',
      error: error.message,
    });
  }
}
async function requestSupplierApproval(req, res) {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fornecedor nao encontrado.',
      });
    }

    if (supplier.status === 'ativo' && supplier.approvalStatus === 'aprovado') {
      return res.status(400).json({
        success: false,
        message: 'Este fornecedor ja esta ativo e aprovado.',
      });
    }

    if (supplier.approvalStatus === 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Este fornecedor ja esta pendente de aprovacao.',
      });
    }

    await supplier.update({
      status: 'bloqueado',
      approvalStatus: 'pendente',
      requestedBy: req.userId,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    });

    await registerAuditLog({
      entityType: 'supplier',
      entityId: supplier.id,
      action: 'supplier_approval_requested',
      description: `Fornecedor "${supplier.name}" enviado para aprovacao.`,
      userId: req.userId,
      metadata: buildSupplierMetadata(supplier),
    });

    return res.json({
      success: true,
      message: 'Fornecedor enviado para aprovacao.',
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar fornecedor para aprovacao.',
      error: error.message,
    });
  }
}

async function approveSupplierApproval(req, res) {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fornecedor nao encontrado.',
      });
    }

    if (supplier.approvalStatus !== 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Somente fornecedores pendentes podem ser aprovados.',
      });
    }

    await supplier.update({
      status: 'ativo',
      approvalStatus: 'aprovado',
      approvedBy: req.userId,
      approvedAt: new Date(),
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    });

    await registerAuditLog({
      entityType: 'supplier',
      entityId: supplier.id,
      action: 'supplier_approved',
      description: `Fornecedor "${supplier.name}" aprovado e ativado.`,
      userId: req.userId,
      metadata: buildSupplierMetadata(supplier),
    });

    return res.json({
      success: true,
      message: 'Fornecedor aprovado e ativado com sucesso.',
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao aprovar fornecedor.',
      error: error.message,
    });
  }
}

async function rejectSupplierApproval(req, res) {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fornecedor nao encontrado.',
      });
    }

    if (supplier.approvalStatus !== 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Somente fornecedores pendentes podem ser reprovados.',
      });
    }

    const reason = req.body.reason || 'Fornecedor reprovado.';

    await supplier.update({
      status: 'bloqueado',
      approvalStatus: 'reprovado',
      rejectedBy: req.userId,
      rejectedAt: new Date(),
      rejectionReason: reason,
    });

    await registerAuditLog({
      entityType: 'supplier',
      entityId: supplier.id,
      action: 'supplier_rejected',
      description: `Fornecedor "${supplier.name}" reprovado.`,
      userId: req.userId,
      metadata: {
        ...buildSupplierMetadata(supplier),
        reason,
      },
    });

    return res.json({
      success: true,
      message: 'Fornecedor reprovado com sucesso.',
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao reprovar fornecedor.',
      error: error.message,
    });
  }
}
async function deleteSupplier(req, res) {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fornecedor nao encontrado.',
      });
    }

    const previousData = buildSupplierMetadata(supplier);

    await supplier.update({
      status: 'inativo',
    });

    await registerAuditLog({
      entityType: 'supplier',
      entityId: supplier.id,
      action: 'supplier_inactivated',
      description: `Fornecedor ${supplier.name} inativado.`,
      userId: req.userId,
      metadata: {
        before: previousData,
        after: buildSupplierMetadata(supplier),
      },
    });

    return res.json({
      success: true,
      message: 'Fornecedor inativado com sucesso.',
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao inativar fornecedor.',
      error: error.message,
    });
  }
}

module.exports = {
  getAllSuppliers,
  getSupplierStats,
  getSupplierById,
  createSupplier,
  updateSupplier,
  requestSupplierApproval,
  approveSupplierApproval,
  rejectSupplierApproval,
  deleteSupplier,
};