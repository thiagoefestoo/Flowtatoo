const { Op } = require('sequelize');

const Customer = require('../models/customer');
const { registerAuditLog } = require('../services/auditService');
const CustomerDocument = require('../models/customerDocument');
const User = require('../models/user');
const createApprovalHandlers = require('./crmApprovalHelper');

const customerInclude = [
  { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
];

function buildCustomerMetadata(customer) {
  return {
    name: customer.name,
    tradeName: customer.tradeName,
    document: customer.document,
    type: customer.type,
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    state: customer.state,
    segment: customer.segment,
    status: customer.status,
    approvalStatus: customer.approvalStatus,
    approvalNote: customer.approvalNote,
  };
}

async function getAllCustomers(req, res) {
  try {
    const { q, type, status, approvalStatus } = req.query;

    const where = {};

    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { tradeName: { [Op.iLike]: `%${q}%` } },
        { document: { [Op.iLike]: `%${q}%` } },
        { city: { [Op.iLike]: `%${q}%` } },
        { segment: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    const customers = await Customer.findAll({
      where,
      include: customerInclude,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar clientes.',
      error: error.message,
    });
  }
}

async function getCustomerStats(req, res) {
  try {
    const total = await Customer.count();
    const ativos = await Customer.count({ where: { status: 'ativo' } });
    const inativos = await Customer.count({ where: { status: 'inativo' } });
    const bloqueados = await Customer.count({ where: { status: 'bloqueado' } });
    const pessoaFisica = await Customer.count({ where: { type: 'pessoa_fisica' } });
    const pessoaJuridica = await Customer.count({ where: { type: 'pessoa_juridica' } });
    const aprovados = await Customer.count({ where: { approvalStatus: 'aprovado' } });
    const pendentes = await Customer.count({ where: { approvalStatus: 'pendente' } });
    const reprovados = await Customer.count({ where: { approvalStatus: 'reprovado' } });

    return res.json({
      success: true,
      data: {
        total,
        ativos,
        inativos,
        bloqueados,
        pessoaFisica,
        pessoaJuridica,
        aprovados,
        pendentes,
        reprovados,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar estatisticas de clientes.',
      error: error.message,
    });
  }
}

async function getCustomerById(req, res) {
  try {
    const customer = await Customer.findByPk(req.params.id, { include: customerInclude });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado.',
      });
    }

    return res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar cliente.',
      error: error.message,
    });
  }
}

async function createCustomer(req, res) {
  try {
    const uploadedDocuments = req.files || [];
    const { name, tradeName, document } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Informe o nome ou razão social do cliente.',
      });
    }

    if (!document) {
      return res.status(400).json({
        success: false,
        message: 'Informe o CPF/CNPJ do cliente.',
      });
    }

    if (document) {
      const existingCustomer = await Customer.findOne({
        where: {
          document: document.trim(),
        },
      });

      if (existingCustomer) {
        return res.status(409).json({
          success: false,
          message: 'Já existe um cliente com este documento.',
        });
      }
    }

    const customer = await Customer.create({
      ...req.body,
      name: name.trim(),
      tradeName: tradeName ? tradeName.trim() : null,
      document: document ? document.trim() : null,
    });

    await registerAuditLog({
      entityType: 'customer',
      entityId: customer.id,
      action: 'customer_created',
      description: `Cliente ${customer.name} criado.`,
      userId: req.userId,
      metadata: buildCustomerMetadata(customer),
    });
for (const file of uploadedDocuments) {
  const document = await CustomerDocument.create({
    customerId: customer.id,
    documentType: req.body.documentType || 'documento',
    originalName: file.originalname,
    fileName: file.filename,
    filePath: `/uploads/customers/${file.filename}`,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    uploadedBy: req.userId,
    notes: req.body.documentNotes || null,
  });

  await registerAuditLog({
    entityType: 'customer',
    entityId: customer.id,
    action: 'customer_document_uploaded',
    description: `Documento "${document.originalName}" anexado ao cliente.`,
    userId: req.userId,
    metadata: {
      customerId: customer.id,
      customerName: customer.name,
      documentType: document.documentType,
      originalName: document.originalName,
      fileName: document.fileName,
      filePath: document.filePath,
      sizeBytes: document.sizeBytes,
      notes: document.notes,
    },
  });
}
    return res.status(201).json({
      success: true,
      message: 'Cliente criado com sucesso.',
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar cliente.',
      error: error.message,
    });
  }
}

async function updateCustomer(req, res) {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado.',
      });
    }

    const previousData = buildCustomerMetadata(customer);

    const { name, tradeName, document } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Informe o nome ou razão social do cliente.',
      });
    }

    if (!document) {
      return res.status(400).json({
        success: false,
        message: 'Informe o CPF/CNPJ do cliente.',
      });
    }

    if (document) {
      const existingCustomer = await Customer.findOne({
        where: {
          document: document.trim(),
          id: {
            [Op.ne]: customer.id,
          },
        },
      });

      if (existingCustomer) {
        return res.status(409).json({
          success: false,
          message: 'Já existe outro cliente com este documento.',
        });
      }
    }

    await customer.update({
      ...req.body,
      name: name.trim(),
      tradeName: tradeName ? tradeName.trim() : null,
      document: document ? document.trim() : null,
    });

    await registerAuditLog({
      entityType: 'customer',
      entityId: customer.id,
      action: 'customer_updated',
      description: `Cliente ${customer.name} atualizado.`,
      userId: req.userId,
      metadata: {
        before: previousData,
        after: buildCustomerMetadata(customer),
      },
    });

    return res.json({
      success: true,
      message: 'Cliente atualizado com sucesso.',
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar cliente.',
      error: error.message,
    });
  }
}

async function deleteCustomer(req, res) {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado.',
      });
    }

    const previousData = buildCustomerMetadata(customer);

    await customer.update({
      status: 'inativo',
    });

    await registerAuditLog({
      entityType: 'customer',
      entityId: customer.id,
      action: 'customer_inactivated',
      description: `Cliente ${customer.name} inativado.`,
      userId: req.userId,
      metadata: {
        before: previousData,
        after: buildCustomerMetadata(customer),
      },
    });

    return res.json({
      success: true,
      message: 'Cliente inativado com sucesso.',
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao inativar cliente.',
      error: error.message,
    });
  }
}

const approval = createApprovalHandlers({
  model: Customer,
  include: customerInclude,
  entityType: 'customer',
  label: 'Cliente',
});

module.exports = {
  getAllCustomers,
  getCustomerStats,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  sendToApproval: approval.sendToApproval,
  approve: approval.approve,
  reject: approval.reject,
};