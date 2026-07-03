const { Op } = require('sequelize');

const AccountPlan = require('../models/accountPlan');
const CostCenter = require('../models/costCenter');
const Customer = require('../models/customer');
const FinancialEntry = require('../models/financialEntry');
const FinancialPaymentProof = require('../models/financialPaymentProof');
const Supplier = require('../models/supplier');
const User = require('../models/user');
const { registerAuditLog } = require('../services/auditService');

function toNumber(value) {
  if (value === undefined || value === null || value === '') return 0;

  if (typeof value === 'string') {
    return Number(value.replace(/\./g, '').replace(',', '.'));
  }

  return Number(value);
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function buildFinancialMetadata(entry) {
  return {
    type: entry.type,
    description: entry.description,
    reference: entry.reference,
    dueDate: entry.dueDate,
    amount: Number(entry.amount || 0),
    paidAmount: Number(entry.paidAmount || 0),
    status: entry.status,
    paymentDate: entry.paymentDate,
    paymentMethod: entry.paymentMethod,
    customerId: entry.customerId,
    supplierId: entry.supplierId,
    costCenterId: entry.costCenterId,
    accountPlanId: entry.accountPlanId,
  };
}

async function refreshOverdueEntries() {
  await FinancialEntry.update(
    {
      status: 'vencido',
    },
    {
      where: {
        status: 'aberto',
        dueDate: {
          [Op.lt]: todayDateOnly(),
        },
      },
    }
  );
}

async function getAllFinancialEntries(req, res) {
  try {
    await refreshOverdueEntries();

    const {
      q,
      type,
      status,
      dateFrom,
      dateTo,
      costCenterId,
      accountPlanId,
    } = req.query;

    const where = {};

    if (q) {
      where[Op.or] = [
        { description: { [Op.iLike]: `%${q}%` } },
        { reference: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (costCenterId) where.costCenterId = costCenterId;
    if (accountPlanId) where.accountPlanId = accountPlanId;

    if (dateFrom || dateTo) {
      where.dueDate = {};

      if (dateFrom) where.dueDate[Op.gte] = dateFrom;
      if (dateTo) where.dueDate[Op.lte] = dateTo;
    }

    const entries = await FinancialEntry.findAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'tradeName', 'document'],
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'tradeName', 'document'],
        },
        {
          model: CostCenter,
          as: 'costCenter',
          attributes: ['id', 'name'],
        },
        {
          model: AccountPlan,
          as: 'accountPlan',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['dueDate', 'ASC']],
    });

    return res.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar financeiro.',
      error: error.message,
    });
  }
}

async function getFinancialStats(req, res) {
  try {
    await refreshOverdueEntries();

    const entries = await FinancialEntry.findAll();

    const contasReceber = entries
      .filter((entry) => entry.type === 'receber' && entry.status !== 'cancelado')
      .reduce((sum, entry) => sum + toNumber(entry.amount), 0);

    const contasPagar = entries
      .filter((entry) => entry.type === 'pagar' && entry.status !== 'cancelado')
      .reduce((sum, entry) => sum + toNumber(entry.amount), 0);

    const recebido = entries
      .filter((entry) => entry.type === 'receber' && entry.status === 'pago')
      .reduce((sum, entry) => sum + toNumber(entry.paidAmount), 0);

    const pago = entries
      .filter((entry) => entry.type === 'pagar' && entry.status === 'pago')
      .reduce((sum, entry) => sum + toNumber(entry.paidAmount), 0);

    const abertoReceber = entries
      .filter((entry) => entry.type === 'receber' && ['aberto', 'vencido'].includes(entry.status))
      .reduce((sum, entry) => sum + toNumber(entry.amount) - toNumber(entry.paidAmount), 0);

    const abertoPagar = entries
      .filter((entry) => entry.type === 'pagar' && ['aberto', 'vencido'].includes(entry.status))
      .reduce((sum, entry) => sum + toNumber(entry.amount) - toNumber(entry.paidAmount), 0);

    const vencidos = entries.filter((entry) => entry.status === 'vencido').length;

    return res.json({
      success: true,
      data: {
        total: entries.length,
        contasReceber,
        contasPagar,
        recebido,
        pago,
        abertoReceber,
        abertoPagar,
        saldoPrevisto: abertoReceber - abertoPagar,
        vencidos,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar estatisticas financeiras.',
      error: error.message,
    });
  }
}

async function createFinancialEntry(req, res) {
  try {
    const {
      type,
      description,
      customerId,
      supplierId,
      costCenterId,
      accountPlanId,
      reference,
      dueDate,
      amount,
      paidAmount,
      status = 'aberto',
      paymentDate,
      paymentMethod,
      notes,
    } = req.body;

    if (!type || !description || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Informe tipo, descricao e vencimento.',
      });
    }

    if (!['receber', 'pagar'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo financeiro invalido.',
      });
    }

    if (type === 'receber' && supplierId) {
      return res.status(400).json({
        success: false,
        message: 'Conta a receber deve ser vinculada a cliente, nao fornecedor.',
      });
    }

    if (type === 'pagar' && customerId) {
      return res.status(400).json({
        success: false,
        message: 'Conta a pagar deve ser vinculada a fornecedor, nao cliente.',
      });
    }

    const entry = await FinancialEntry.create({
      type,
      description: description.trim(),
      customerId: customerId || null,
      supplierId: supplierId || null,
      costCenterId: costCenterId || null,
      accountPlanId: accountPlanId || null,
      userId: req.userId,
      reference,
      dueDate,
      amount: toNumber(amount),
      paidAmount: toNumber(paidAmount),
      status,
      paymentDate: paymentDate || null,
      paymentMethod,
      notes,
    });

    await registerAuditLog({
      entityType: 'financial',
      entityId: entry.id,
      action: 'financial_created',
      description: `Lancamento financeiro "${entry.description}" criado.`,
      userId: req.userId,
      metadata: buildFinancialMetadata(entry),
    });

    return res.status(201).json({
      success: true,
      message: 'Lancamento financeiro criado com sucesso.',
      data: entry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar lancamento financeiro.',
      error: error.message,
    });
  }
}

async function updateFinancialEntry(req, res) {
  try {
    const entry = await FinancialEntry.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Lancamento financeiro nao encontrado.',
      });
    }

    const previousData = buildFinancialMetadata(entry);

    const {
      type,
      description,
      customerId,
      supplierId,
      costCenterId,
      accountPlanId,
      reference,
      dueDate,
      amount,
      paidAmount,
      status,
      paymentDate,
      paymentMethod,
      notes,
    } = req.body;

    if (!type || !description || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Informe tipo, descricao e vencimento.',
      });
    }

    await entry.update({
      type,
      description: description.trim(),
      customerId: customerId || null,
      supplierId: supplierId || null,
      costCenterId: costCenterId || null,
      accountPlanId: accountPlanId || null,
      reference,
      dueDate,
      amount: toNumber(amount),
      paidAmount: toNumber(paidAmount),
      status,
      paymentDate: paymentDate || null,
      paymentMethod,
      notes,
    });

    await registerAuditLog({
      entityType: 'financial',
      entityId: entry.id,
      action: 'financial_updated',
      description: `Lancamento financeiro "${entry.description}" atualizado.`,
      userId: req.userId,
      metadata: {
        before: previousData,
        after: buildFinancialMetadata(entry),
      },
    });

    return res.json({
      success: true,
      message: 'Lancamento financeiro atualizado com sucesso.',
      data: entry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar lancamento financeiro.',
      error: error.message,
    });
  }
}
async function getFinancialPaymentProofs(req, res) {
  try {
    const { id } = req.params;

    const proofs = await FinancialPaymentProof.findAll({
      where: {
        financialEntryId: id,
      },
      include: [
        {
          model: User,
          as: 'uploadedByUser',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: proofs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar comprovantes do lançamento financeiro.',
      error: error.message,
    });
  }
}
async function markFinancialEntryAsPaid(req, res) {
  try {
    const entry = await FinancialEntry.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Lancamento financeiro nao encontrado.',
      });
    }

    if (entry.status === 'pago') {
      return res.status(400).json({
        success: false,
        message: 'Este lancamento ja esta pago.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Anexe o comprovante de pagamento para realizar a baixa.',
      });
    }

    const {
      paymentDate,
      paymentMethod,
      paidAmount,
      proofNumber,
      bankAccount,
      notes,
    } = req.body;

    if (!paymentDate) {
      return res.status(400).json({
        success: false,
        message: 'Informe a data do pagamento.',
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Informe a forma de pagamento.',
      });
    }

    const amountToPay = toNumber(paidAmount || entry.amount);

    if (amountToPay <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Informe um valor pago maior que zero.',
      });
    }

    const previousData = buildFinancialMetadata(entry);

    await entry.update({
      status: 'pago',
      paidAmount: amountToPay,
      paymentDate,
      paymentMethod,
    });

    const proof = await FinancialPaymentProof.create({
      financialEntryId: entry.id,
      paymentDate,
      paymentMethod,
      paidAmount: amountToPay,
      proofNumber: proofNumber || null,
      bankAccount: bankAccount || null,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: `/uploads/financial/${req.file.filename}`,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedBy: req.userId,
      notes: notes || null,
    });

    await registerAuditLog({
      entityType: 'financial',
      entityId: entry.id,
      action: 'financial_paid',
      description: `Lancamento financeiro "${entry.description}" baixado com comprovante.`,
      userId: req.userId,
      metadata: {
        before: previousData,
        after: buildFinancialMetadata(entry),
        paymentProof: {
          id: proof.id,
          paymentDate: proof.paymentDate,
          paymentMethod: proof.paymentMethod,
          paidAmount: Number(proof.paidAmount || 0),
          proofNumber: proof.proofNumber,
          bankAccount: proof.bankAccount,
          originalName: proof.originalName,
          fileName: proof.fileName,
          filePath: proof.filePath,
          sizeBytes: proof.sizeBytes,
          notes: proof.notes,
        },
      },
    });

    return res.json({
      success: true,
      message: 'Lancamento marcado como pago com comprovante.',
      data: entry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao baixar lancamento financeiro.',
      error: error.message,
    });
  }
}

async function cancelFinancialEntry(req, res) {
  try {
    const entry = await FinancialEntry.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Lancamento financeiro nao encontrado.',
      });
    }

    const previousData = buildFinancialMetadata(entry);

    await entry.update({
      status: 'cancelado',
    });

    await registerAuditLog({
      entityType: 'financial',
      entityId: entry.id,
      action: 'financial_cancelled',
      description: `Lancamento financeiro "${entry.description}" cancelado.`,
      userId: req.userId,
      metadata: {
        before: previousData,
        after: buildFinancialMetadata(entry),
      },
    });

    return res.json({
      success: true,
      message: 'Lancamento financeiro cancelado com sucesso.',
      data: entry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao cancelar lancamento financeiro.',
      error: error.message,
    });
  }
}

async function getManagementDre(req, res) {
  try {
    await refreshOverdueEntries();

    const { dateFrom, dateTo, costCenterId } = req.query;

    const where = {
      status: {
        [Op.ne]: 'cancelado',
      },
    };

    if (dateFrom || dateTo) {
      where.dueDate = {};

      if (dateFrom) where.dueDate[Op.gte] = dateFrom;
      if (dateTo) where.dueDate[Op.lte] = dateTo;
    }

    if (costCenterId) {
      where.costCenterId = costCenterId;
    }

    const entries = await FinancialEntry.findAll({
      where,
      include: [
        {
          model: AccountPlan,
          as: 'accountPlan',
          attributes: ['id', 'code', 'name', 'type', 'nature'],
        },
        {
          model: CostCenter,
          as: 'costCenter',
          attributes: ['id', 'code', 'name', 'type'],
        },
      ],
      order: [['dueDate', 'ASC']],
    });

    const summary = {
      receitas: 0,
      custos: 0,
      despesas: 0,
      resultado: 0,
      totalLancamentos: entries.length,
    };

    const byAccountPlan = {};
    const byCostCenter = {};

    entries.forEach((entry) => {
      const amount = toNumber(entry.amount);
      const accountType = entry.accountPlan?.type;

      if (accountType === 'receita') {
        summary.receitas += amount;
      } else if (accountType === 'custo') {
        summary.custos += amount;
      } else if (accountType === 'despesa') {
        summary.despesas += amount;
      } else if (entry.type === 'receber') {
        summary.receitas += amount;
      } else if (entry.type === 'pagar') {
        summary.despesas += amount;
      }

      const accountKey = entry.accountPlan
        ? `${entry.accountPlan.code} - ${entry.accountPlan.name}`
        : 'Sem plano de contas';

      if (!byAccountPlan[accountKey]) {
        byAccountPlan[accountKey] = {
          name: accountKey,
          type: accountType || entry.type,
          amount: 0,
        };
      }

      byAccountPlan[accountKey].amount += amount;

      const costCenterKey = entry.costCenter
        ? `${entry.costCenter.code} - ${entry.costCenter.name}`
        : 'Sem centro de custo';

      if (!byCostCenter[costCenterKey]) {
        byCostCenter[costCenterKey] = {
          name: costCenterKey,
          amount: 0,
        };
      }

      byCostCenter[costCenterKey].amount += amount;
    });

    summary.resultado = summary.receitas - summary.custos - summary.despesas;

    return res.json({
      success: true,
      data: {
        summary,
        byAccountPlan: Object.values(byAccountPlan),
        byCostCenter: Object.values(byCostCenter),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar DRE gerencial.',
      error: error.message,
    });
  }
}

module.exports = {
  getAllFinancialEntries,
  getFinancialStats,
  getManagementDre,
  getFinancialPaymentProofs,
  createFinancialEntry,
  updateFinancialEntry,
  markFinancialEntryAsPaid,
  cancelFinancialEntry,
};