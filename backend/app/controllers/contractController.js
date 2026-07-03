const { Op } = require('sequelize');

const Contract = require('../models/contract');
const { registerAuditLog } = require('../services/auditService');

function toNumber(value) {
  if (value === undefined || value === null || value === '') return 0;

  if (typeof value === 'string') {
    return Number(value.replace(/\./g, '').replace(',', '.'));
  }

  return Number(value);
}

function sanitizeContract(contract) {
  if (!contract) return null;

  return {
    id: contract.id,
    number: contract.number,
    title: contract.title,
    type: contract.type,
    status: contract.status,
    approvalStatus: contract.approvalStatus,
    requestedBy: contract.requestedBy,
    approvedBy: contract.approvedBy,
    approvedAt: contract.approvedAt,
    rejectedBy: contract.rejectedBy,
    rejectedAt: contract.rejectedAt,
    rejectionReason: contract.rejectionReason,
    customerId: contract.customerId,
    supplierId: contract.supplierId,
    startDate: contract.startDate,
    endDate: contract.endDate,
    monthlyValue: Number(contract.monthlyValue || 0),
    totalValue: Number(contract.totalValue || 0),
    paymentDay: contract.paymentDay,
    renewalType: contract.renewalType,
    object: contract.object,
    notes: contract.notes,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
  };
}

function buildContractMetadata(contract) {
  return {
    number: contract.number,
    title: contract.title,
    type: contract.type,
    status: contract.status,
    approvalStatus: contract.approvalStatus,
    customerId: contract.customerId,
    supplierId: contract.supplierId,
    startDate: contract.startDate,
    endDate: contract.endDate,
    monthlyValue: Number(contract.monthlyValue || 0),
    totalValue: Number(contract.totalValue || 0),
    paymentDay: contract.paymentDay,
    renewalType: contract.renewalType,
  };
}

async function getAllContracts(req, res) {
  try {
    const { q, type, status, approvalStatus } = req.query;

    const where = {};

    if (q) {
      where[Op.or] = [
        { number: { [Op.iLike]: `%${q}%` } },
        { title: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    const contracts = await Contract.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: contracts.map(sanitizeContract),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar contratos.',
      error: error.message,
    });
  }
}

function buildContractMetadata(contract) {
  return {
    number: contract.number,
    title: contract.title,
    type: contract.type,
    status: contract.status,
    approvalStatus: contract.approvalStatus,
    customerId: contract.customerId,
    supplierId: contract.supplierId,
    startDate: contract.startDate,
    endDate: contract.endDate,
    monthlyValue: Number(contract.monthlyValue || 0),
    totalValue: Number(contract.totalValue || 0),
    paymentDay: contract.paymentDay,
    renewalType: contract.renewalType,
  };
}

async function getContractStats(req, res) {
  try {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const total = await Contract.count();
    const ativos = await Contract.count({ where: { status: 'ativo' } });
    const rascunhos = await Contract.count({ where: { status: 'rascunho' } });
    const suspensos = await Contract.count({ where: { status: 'suspenso' } });
    const encerrados = await Contract.count({ where: { status: 'encerrado' } });
    const cancelados = await Contract.count({ where: { status: 'cancelado' } });

    const pendentesAprovacao = await Contract.count({
      where: {
        approvalStatus: 'pendente',
      },
    });

    const aprovados = await Contract.count({
      where: {
        approvalStatus: 'aprovado',
      },
    });

    const reprovados = await Contract.count({
      where: {
        approvalStatus: 'reprovado',
      },
    });

    const vencendo = await Contract.count({
      where: {
        status: 'ativo',
        endDate: {
          [Op.ne]: null,
          [Op.gte]: today,
          [Op.lte]: next30Days,
        },
      },
    });

    const receitaMensal = await Contract.sum('monthlyValue', {
      where: {
        status: 'ativo',
        type: 'cliente',
      },
    });

    const custoMensal = await Contract.sum('monthlyValue', {
      where: {
        status: 'ativo',
        type: 'fornecedor',
      },
    });

    return res.json({
      success: true,
      data: {
        total,
        ativos,
        rascunhos,
        suspensos,
        encerrados,
        cancelados,
        pendentesAprovacao,
        aprovados,
        reprovados,
        vencendo,
        receitaMensal: Number(receitaMensal || 0),
        custoMensal: Number(custoMensal || 0),
        saldoMensal: Number(receitaMensal || 0) - Number(custoMensal || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar estatisticas de contratos.',
      error: error.message,
    });
  }
}

async function getContractById(req, res) {
  try {
    const contract = await Contract.findByPk(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato nao encontrado.',
      });
    }

    return res.json({
      success: true,
      data: sanitizeContract(contract),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar contrato.',
      error: error.message,
    });
  }
}

async function createContract(req, res) {
  try {
    const {
      number,
      title,
      type = 'cliente',
      customerId,
      supplierId,
      startDate,
      endDate,
      monthlyValue = 0,
      totalValue = 0,
      paymentDay,
      renewalType = 'manual',
      object,
      notes,
    } = req.body;

    if (!number || !title || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Informe numero, titulo e data inicial do contrato.',
      });
    }

    const existingContract = await Contract.findOne({
      where: {
        number: number.trim(),
      },
    });

    if (existingContract) {
      return res.status(409).json({
        success: false,
        message: 'Ja existe um contrato com este numero.',
      });
    }

    const contract = await Contract.create({
      number: number.trim(),
      title: title.trim(),
      type,
      status: 'rascunho',
      approvalStatus: 'nao_enviado',
      customerId: customerId || null,
      supplierId: supplierId || null,
      startDate,
      endDate: endDate || null,
      monthlyValue: toNumber(monthlyValue),
      totalValue: toNumber(totalValue),
      paymentDay: paymentDay || null,
      renewalType,
      object,
      notes,
    });

    await registerAuditLog({
      entityType: 'contract',
      entityId: contract.id,
      action: 'contract_created',
      description: `Contrato ${contract.number} criado como rascunho.`,
      userId: req.userId,
      metadata: buildContractMetadata(contract),
    });

    return res.status(201).json({
      success: true,
      message: 'Contrato criado como rascunho. Envie para aprovacao antes de ativar.',
      data: sanitizeContract(contract),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar contrato.',
      error: error.message,
    });
  }
}

async function updateContract(req, res) {
  try {
    const contract = await Contract.findByPk(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato nao encontrado.',
      });
    }

    if (contract.status === 'ativo') {
      return res.status(400).json({
        success: false,
        message: 'Contrato ativo nao pode ser editado nesta etapa. Use ajuste contratual ou aditivo posteriormente.',
      });
    }

    if (contract.approvalStatus === 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Contrato pendente de aprovacao nao pode ser editado.',
      });
    }

    const {
      number,
      title,
      type,
      customerId,
      supplierId,
      startDate,
      endDate,
      monthlyValue,
      totalValue,
      paymentDay,
      renewalType,
      object,
      notes,
    } = req.body;

    const previousData = buildContractMetadata(contract);
    const payload = {};

    if (number !== undefined) {
      const normalizedNumber = number.trim();

      const existingContract = await Contract.findOne({
        where: {
          number: normalizedNumber,
          id: {
            [Op.ne]: contract.id,
          },
        },
      });

      if (existingContract) {
        return res.status(409).json({
          success: false,
          message: 'Ja existe outro contrato com este numero.',
        });
      }

      payload.number = normalizedNumber;
    }

    if (title !== undefined) payload.title = title.trim();
    if (type !== undefined) payload.type = type;
    if (customerId !== undefined) payload.customerId = customerId || null;
    if (supplierId !== undefined) payload.supplierId = supplierId || null;
    if (startDate !== undefined) payload.startDate = startDate;
    if (endDate !== undefined) payload.endDate = endDate || null;
    if (monthlyValue !== undefined) payload.monthlyValue = toNumber(monthlyValue);
    if (totalValue !== undefined) payload.totalValue = toNumber(totalValue);
    if (paymentDay !== undefined) payload.paymentDay = paymentDay || null;
    if (renewalType !== undefined) payload.renewalType = renewalType;
    if (object !== undefined) payload.object = object;
    if (notes !== undefined) payload.notes = notes;

    if (contract.approvalStatus === 'reprovado') {
      payload.approvalStatus = 'nao_enviado';
      payload.rejectedBy = null;
      payload.rejectedAt = null;
      payload.rejectionReason = null;
    }

    await contract.update(payload);

    await registerAuditLog({
      entityType: 'contract',
      entityId: contract.id,
      action: 'contract_updated',
      description: `Contrato ${contract.number} atualizado.`,
      userId: req.userId,
      metadata: {
        before: previousData,
        after: buildContractMetadata(contract),
      },
    });

    return res.json({
      success: true,
      message: 'Contrato atualizado com sucesso.',
      data: sanitizeContract(contract),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar contrato.',
      error: error.message,
    });
  }
}

async function requestContractApproval(req, res) {
  try {
    const contract = await Contract.findByPk(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato nao encontrado.',
      });
    }

    if (contract.status !== 'rascunho') {
      return res.status(400).json({
        success: false,
        message: 'Somente contratos em rascunho podem ser enviados para aprovacao.',
      });
    }

    if (contract.approvalStatus === 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Este contrato ja esta pendente de aprovacao.',
      });
    }

    await contract.update({
      approvalStatus: 'pendente',
      requestedBy: req.userId,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    });

    await registerAuditLog({
      entityType: 'contract',
      entityId: contract.id,
      action: 'contract_approval_requested',
      description: `Contrato ${contract.number} enviado para aprovacao.`,
      userId: req.userId,
      metadata: buildContractMetadata(contract),
    });

    return res.json({
      success: true,
      message: 'Contrato enviado para aprovacao.',
      data: sanitizeContract(contract),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar contrato para aprovacao.',
      error: error.message,
    });
  }
}

async function approveContractApproval(req, res) {
  try {
    const contract = await Contract.findByPk(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato nao encontrado.',
      });
    }

    if (contract.status === 'ativo') {
      return res.status(400).json({
        success: false,
        message: 'Este contrato ja esta ativo.',
      });
    }

    if (contract.status === 'cancelado' || contract.status === 'encerrado') {
      return res.status(400).json({
        success: false,
        message: 'Contrato cancelado ou encerrado nao pode ser aprovado.',
      });
    }

    if (contract.approvalStatus !== 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Somente contratos pendentes podem ser aprovados.',
      });
    }

    await contract.update({
      status: 'ativo',
      approvalStatus: 'aprovado',
      approvedBy: req.userId,
      approvedAt: new Date(),
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    });

    await registerAuditLog({
      entityType: 'contract',
      entityId: contract.id,
      action: 'contract_approved',
      description: `Contrato ${contract.number} aprovado e ativado.`,
      userId: req.userId,
      metadata: buildContractMetadata(contract),
    });

    return res.json({
      success: true,
      message: 'Contrato aprovado e ativado com sucesso.',
      data: sanitizeContract(contract),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao aprovar contrato.',
      error: error.message,
    });
  }
}

async function rejectContractApproval(req, res) {
  try {
    const contract = await Contract.findByPk(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato nao encontrado.',
      });
    }

    if (contract.approvalStatus !== 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Somente contratos pendentes podem ser reprovados.',
      });
    }

    const reason = req.body.reason || 'Contrato reprovado.';

    await contract.update({
      approvalStatus: 'reprovado',
      rejectedBy: req.userId,
      rejectedAt: new Date(),
      rejectionReason: reason,
    });

    await registerAuditLog({
      entityType: 'contract',
      entityId: contract.id,
      action: 'contract_rejected',
      description: `Contrato ${contract.number} reprovado.`,
      userId: req.userId,
      metadata: {
        ...buildContractMetadata(contract),
        reason,
      },
    });

    return res.json({
      success: true,
      message: 'Contrato reprovado com sucesso.',
      data: sanitizeContract(contract),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao reprovar contrato.',
      error: error.message,
    });
  }
}
async function requestContractApproval(req, res) {
  try {
    const contract = await Contract.findByPk(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato nao encontrado.',
      });
    }

    if (contract.status !== 'rascunho') {
      return res.status(400).json({
        success: false,
        message: 'Somente contratos em rascunho podem ser enviados para aprovacao.',
      });
    }

    if (contract.approvalStatus === 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Este contrato ja esta pendente de aprovacao.',
      });
    }

    await contract.update({
      approvalStatus: 'pendente',
      requestedBy: req.userId,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    });

    await registerAuditLog({
      entityType: 'contract',
      entityId: contract.id,
      action: 'contract_approval_requested',
      description: `Contrato ${contract.number} enviado para aprovacao.`,
      userId: req.userId,
      metadata: buildContractMetadata(contract),
    });

    return res.json({
      success: true,
      message: 'Contrato enviado para aprovacao.',
      data: sanitizeContract(contract),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar contrato para aprovacao.',
      error: error.message,
    });
  }
}

async function approveContractApproval(req, res) {
  try {
    const contract = await Contract.findByPk(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato nao encontrado.',
      });
    }

    if (contract.status === 'ativo') {
      return res.status(400).json({
        success: false,
        message: 'Este contrato ja esta ativo.',
      });
    }

    if (contract.status === 'cancelado' || contract.status === 'encerrado') {
      return res.status(400).json({
        success: false,
        message: 'Contrato cancelado ou encerrado nao pode ser aprovado.',
      });
    }

    if (contract.approvalStatus !== 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Somente contratos pendentes podem ser aprovados.',
      });
    }

    await contract.update({
      status: 'ativo',
      approvalStatus: 'aprovado',
      approvedBy: req.userId,
      approvedAt: new Date(),
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    });

    await registerAuditLog({
      entityType: 'contract',
      entityId: contract.id,
      action: 'contract_approved',
      description: `Contrato ${contract.number} aprovado e ativado.`,
      userId: req.userId,
      metadata: buildContractMetadata(contract),
    });

    return res.json({
      success: true,
      message: 'Contrato aprovado e ativado com sucesso.',
      data: sanitizeContract(contract),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao aprovar contrato.',
      error: error.message,
    });
  }
}

async function rejectContractApproval(req, res) {
  try {
    const contract = await Contract.findByPk(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato nao encontrado.',
      });
    }

    if (contract.approvalStatus !== 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Somente contratos pendentes podem ser reprovados.',
      });
    }

    const reason = req.body.reason || 'Contrato reprovado.';

    await contract.update({
      approvalStatus: 'reprovado',
      rejectedBy: req.userId,
      rejectedAt: new Date(),
      rejectionReason: reason,
    });

    await registerAuditLog({
      entityType: 'contract',
      entityId: contract.id,
      action: 'contract_rejected',
      description: `Contrato ${contract.number} reprovado.`,
      userId: req.userId,
      metadata: {
        ...buildContractMetadata(contract),
        reason,
      },
    });

    return res.json({
      success: true,
      message: 'Contrato reprovado com sucesso.',
      data: sanitizeContract(contract),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao reprovar contrato.',
      error: error.message,
    });
  }
}

async function deleteContract(req, res) {
  try {
    const contract = await Contract.findByPk(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato nao encontrado.',
      });
    }

    if (contract.status === 'cancelado') {
      return res.status(400).json({
        success: false,
        message: 'Este contrato ja esta cancelado.',
      });
    }

    await contract.update({
      status: 'cancelado',
    });

    await registerAuditLog({
      entityType: 'contract',
      entityId: contract.id,
      action: 'contract_cancelled',
      description: `Contrato ${contract.number} cancelado.`,
      userId: req.userId,
      metadata: buildContractMetadata(contract),
    });

    return res.json({
      success: true,
      message: 'Contrato cancelado com sucesso.',
      data: sanitizeContract(contract),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao cancelar contrato.',
      error: error.message,
    });
  }
}

module.exports = {
  getAllContracts,
  getContractStats,
  getContractById,
  createContract,
  updateContract,
  requestContractApproval,
  approveContractApproval,
  rejectContractApproval,
  deleteContract,
};