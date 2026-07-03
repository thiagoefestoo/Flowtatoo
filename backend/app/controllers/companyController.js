const { Op } = require('sequelize');

const Company = require('../models/company');
const User = require('../models/user');
const { registerAuditLog } = require('../services/auditService');
const createApprovalHandlers = require('./crmApprovalHelper');

const companyInclude = [
  { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
];

function buildCompanyMetadata(company) {
  return {
    corporateName: company.corporateName,
    tradeName: company.tradeName,
    document: company.document,
    type: company.type,
    email: company.email,
    phone: company.phone,
    city: company.city,
    state: company.state,
    status: company.status,
    approvalStatus: company.approvalStatus,
    approvalNote: company.approvalNote,
  };
}

async function getAllCompanies(req, res) {
  try {
    const { q, type, status, approvalStatus } = req.query;

    const where = {};

    if (q) {
      where[Op.or] = [
        { corporateName: { [Op.iLike]: `%${q}%` } },
        { tradeName: { [Op.iLike]: `%${q}%` } },
        { document: { [Op.iLike]: `%${q}%` } },
        { city: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    const companies = await Company.findAll({
      where,
      include: companyInclude,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar empresas.',
      error: error.message,
    });
  }
}

async function getCompanyStats(req, res) {
  try {
    const total = await Company.count();
    const ativas = await Company.count({ where: { status: 'ativa' } });
    const inativas = await Company.count({ where: { status: 'inativa' } });
    const matriz = await Company.count({ where: { type: 'matriz' } });
    const filiais = await Company.count({ where: { type: 'filial' } });
    const aprovadas = await Company.count({ where: { approvalStatus: 'aprovado' } });
    const pendentes = await Company.count({ where: { approvalStatus: 'pendente' } });
    const reprovadas = await Company.count({ where: { approvalStatus: 'reprovado' } });

    return res.json({
      success: true,
      data: {
        total,
        ativas,
        inativas,
        matriz,
        filiais,
        aprovadas,
        pendentes,
        reprovadas,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar estatisticas de empresas.',
      error: error.message,
    });
  }
}

async function getCompanyById(req, res) {
  try {
    const company = await Company.findByPk(req.params.id, { include: companyInclude });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada.',
      });
    }

    return res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar empresa.',
      error: error.message,
    });
  }
}

async function createCompany(req, res) {
  try {
    const { corporateName, tradeName, document } = req.body;

    if (!corporateName) {
      return res.status(400).json({
        success: false,
        message: 'Informe a razão social.',
      });
    }

    if (!document) {
      return res.status(400).json({
        success: false,
        message: 'Informe o documento da empresa.',
      });
    }

    if (document) {
      const existingCompany = await Company.findOne({
        where: {
          document: document.trim(),
        },
      });

      if (existingCompany) {
        return res.status(409).json({
          success: false,
          message: 'Já existe uma empresa com este documento.',
        });
      }
    }

    const company = await Company.create({
      ...req.body,
      corporateName: corporateName.trim(),
      tradeName: tradeName ? tradeName.trim() : null,
      document: document ? document.trim() : null,
    });

    await registerAuditLog({
      entityType: 'company',
      entityId: company.id,
      action: 'company_created',
      description: `Empresa ${company.tradeName || company.corporateName} criada.`,
      userId: req.userId,
      metadata: buildCompanyMetadata(company),
    });

    return res.status(201).json({
      success: true,
      message: 'Empresa criada com sucesso.',
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar empresa.',
      error: error.message,
    });
  }
}

async function updateCompany(req, res) {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada.',
      });
    }

    const previousData = buildCompanyMetadata(company);

    const { corporateName, tradeName, document } = req.body;

    if (!corporateName) {
      return res.status(400).json({
        success: false,
        message: 'Informe a razão social.',
      });
    }

    if (!document) {
      return res.status(400).json({
        success: false,
        message: 'Informe o documento da empresa.',
      });
    }

    if (document) {
      const existingCompany = await Company.findOne({
        where: {
          document: document.trim(),
          id: {
            [Op.ne]: company.id,
          },
        },
      });

      if (existingCompany) {
        return res.status(409).json({
          success: false,
          message: 'Já existe outra empresa com este documento.',
        });
      }
    }

    await company.update({
      ...req.body,
      corporateName: corporateName.trim(),
      tradeName: tradeName ? tradeName.trim() : null,
      document: document ? document.trim() : null,
    });

    await registerAuditLog({
      entityType: 'company',
      entityId: company.id,
      action: 'company_updated',
      description: `Empresa ${company.tradeName || company.corporateName} atualizada.`,
      userId: req.userId,
      metadata: {
        before: previousData,
        after: buildCompanyMetadata(company),
      },
    });

    return res.json({
      success: true,
      message: 'Empresa atualizada com sucesso.',
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar empresa.',
      error: error.message,
    });
  }
}

async function deleteCompany(req, res) {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada.',
      });
    }

    const previousData = buildCompanyMetadata(company);

    await company.update({
      status: 'inativa',
    });

    await registerAuditLog({
      entityType: 'company',
      entityId: company.id,
      action: 'company_inactivated',
      description: `Empresa ${company.tradeName || company.corporateName} inativada.`,
      userId: req.userId,
      metadata: {
        before: previousData,
        after: buildCompanyMetadata(company),
      },
    });

    return res.json({
      success: true,
      message: 'Empresa inativada com sucesso.',
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao inativar empresa.',
      error: error.message,
    });
  }
}


const approval = createApprovalHandlers({
  model: Company,
  include: companyInclude,
  entityType: 'company',
  label: 'Empresa / filial',
});

module.exports = {
  getAllCompanies,
  getCompanyStats,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  sendToApproval: approval.sendToApproval,
  approve: approval.approve,
  reject: approval.reject,
};