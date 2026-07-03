const { Op } = require('sequelize');

const Project = require('../models/project');
const { registerAuditLog } = require('../services/auditService');

function sanitizeProject(project) {
  if (!project) return null;

  return {
    id: project.id,
    code: project.code,
    name: project.name,
    status: project.status,
    approvalStatus: project.approvalStatus,
requestedBy: project.requestedBy,
approvedBy: project.approvedBy,
approvedAt: project.approvedAt,
rejectedBy: project.rejectedBy,
rejectedAt: project.rejectedAt,
rejectionReason: project.rejectionReason,
    priority: project.priority,
    customerId: project.customerId,
    contractId: project.contractId,
    managerName: project.managerName,
    startDate: project.startDate,
    endDate: project.endDate,
    budget: Number(project.budget || 0),
    spentValue: Number(project.spentValue || 0),
    balance: Number(project.budget || 0) - Number(project.spentValue || 0),
    progress: Number(project.progress || 0),
    description: project.description,
    notes: project.notes,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function buildProjectMetadata(project) {
  return {
    code: project.code,
    name: project.name,
    status: project.status,
    approvalStatus: project.approvalStatus,
    priority: project.priority,
    customerId: project.customerId,
    contractId: project.contractId,
    managerName: project.managerName,
    startDate: project.startDate,
    endDate: project.endDate,
    budget: Number(project.budget || 0),
    spentValue: Number(project.spentValue || 0),
    progress: Number(project.progress || 0),
  };
}

async function getAllProjects(req, res) {
  try {
    const { q, status, priority, approvalStatus } = req.query;
    const where = {};

    if (q) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${q}%` } },
        { name: { [Op.iLike]: `%${q}%` } },
        { managerName: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    const projects = await Project.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: projects.map(sanitizeProject),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar projetos.',
      error: error.message,
    });
  }
}

async function getProjectStats(req, res) {
  try {
    const total = await Project.count();
    const planejamento = await Project.count({ where: { status: 'planejamento' } });
    const emAndamento = await Project.count({ where: { status: 'em_andamento' } });
    const pausados = await Project.count({ where: { status: 'pausado' } });
    const concluidos = await Project.count({ where: { status: 'concluido' } });
    const cancelados = await Project.count({ where: { status: 'cancelado' } });
const pendentesAprovacao = await Project.count({
  where: {
    approvalStatus: 'pendente',
  },
});

const aprovados = await Project.count({
  where: {
    approvalStatus: 'aprovado',
  },
});

const reprovados = await Project.count({
  where: {
    approvalStatus: 'reprovado',
  },
});
    const budgetTotal = await Project.sum('budget');
    const spentTotal = await Project.sum('spentValue');

    return res.json({
      success: true,
data: {
  total,
  planejamento,
  emAndamento,
  pausados,
  concluidos,
  cancelados,
  pendentesAprovacao,
  aprovados,
  reprovados,
  budgetTotal: Number(budgetTotal || 0),
  spentTotal: Number(spentTotal || 0),
  balanceTotal: Number(budgetTotal || 0) - Number(spentTotal || 0),
},
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar estatisticas de projetos.',
      error: error.message,
    });
  }
}

async function getProjectById(req, res) {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projeto nao encontrado.',
      });
    }

    return res.json({
      success: true,
      data: sanitizeProject(project),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar projeto.',
      error: error.message,
    });
  }
}

async function createProject(req, res) {
  try {
    const {
      code,
      name,
      priority = 'media',
      customerId,
      contractId,
      managerName,
      startDate,
      endDate,
      budget = 0,
      spentValue = 0,
      progress = 0,
      description,
      notes,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'Informe codigo e nome do projeto.',
      });
    }

    const existingProject = await Project.findOne({
      where: { code: code.trim() },
    });

    if (existingProject) {
      return res.status(409).json({
        success: false,
        message: 'Ja existe um projeto com este codigo.',
      });
    }

    const project = await Project.create({
      code: code.trim(),
      name: name.trim(),
      status: 'planejamento',
      approvalStatus: 'nao_enviado',
      priority,
      customerId: customerId || null,
      contractId: contractId || null,
      managerName,
      startDate: startDate || null,
      endDate: endDate || null,
      budget,
      spentValue,
      progress,
      description,
      notes,
    });

    await registerAuditLog({
      entityType: 'project',
      entityId: project.id,
      action: 'project_created',
      description: `Projeto ${project.code} criado em planejamento.`,
      userId: req.userId,
      metadata: buildProjectMetadata(project),
    });

    return res.status(201).json({
      success: true,
      message: 'Projeto criado em planejamento. Envie para aprovacao antes de iniciar.',
      data: sanitizeProject(project),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar projeto.',
      error: error.message,
    });
  }
}

async function updateProject(req, res) {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projeto nao encontrado.',
      });
    }

    const payload = { ...req.body };

    if (payload.code !== undefined) {
      const normalizedCode = payload.code.trim();

      const existingProject = await Project.findOne({
        where: {
          code: normalizedCode,
          id: { [Op.ne]: project.id },
        },
      });

      if (existingProject) {
        return res.status(409).json({
          success: false,
          message: 'Ja existe outro projeto com este codigo.',
        });
      }

      payload.code = normalizedCode;
    }

    if (payload.name !== undefined) payload.name = payload.name.trim();
    if (payload.customerId === '') payload.customerId = null;
    if (payload.contractId === '') payload.contractId = null;
    if (payload.startDate === '') payload.startDate = null;
    if (payload.endDate === '') payload.endDate = null;

    await project.update(payload);

    return res.json({
      success: true,
      message: 'Projeto atualizado com sucesso.',
      data: sanitizeProject(project),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar projeto.',
      error: error.message,
    });
  }
}
async function requestProjectApproval(req, res) {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projeto nao encontrado.',
      });
    }

    if (project.status !== 'planejamento') {
      return res.status(400).json({
        success: false,
        message: 'Somente projetos em planejamento podem ser enviados para aprovacao.',
      });
    }

    if (project.approvalStatus === 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Este projeto ja esta pendente de aprovacao.',
      });
    }

    await project.update({
      approvalStatus: 'pendente',
      requestedBy: req.userId,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    });

    await registerAuditLog({
      entityType: 'project',
      entityId: project.id,
      action: 'project_approval_requested',
      description: `Projeto ${project.code} enviado para aprovacao.`,
      userId: req.userId,
      metadata: buildProjectMetadata(project),
    });

    return res.json({
      success: true,
      message: 'Projeto enviado para aprovacao.',
      data: sanitizeProject(project),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar projeto para aprovacao.',
      error: error.message,
    });
  }
}

async function approveProjectApproval(req, res) {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projeto nao encontrado.',
      });
    }

    if (project.status === 'em_andamento') {
      return res.status(400).json({
        success: false,
        message: 'Este projeto ja esta em andamento.',
      });
    }

    if (project.status === 'cancelado' || project.status === 'concluido') {
      return res.status(400).json({
        success: false,
        message: 'Projeto cancelado ou concluido nao pode ser aprovado.',
      });
    }

    if (project.approvalStatus !== 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Somente projetos pendentes podem ser aprovados.',
      });
    }

    await project.update({
      status: 'em_andamento',
      approvalStatus: 'aprovado',
      approvedBy: req.userId,
      approvedAt: new Date(),
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    });

    await registerAuditLog({
      entityType: 'project',
      entityId: project.id,
      action: 'project_approved',
      description: `Projeto ${project.code} aprovado e iniciado.`,
      userId: req.userId,
      metadata: buildProjectMetadata(project),
    });

    return res.json({
      success: true,
      message: 'Projeto aprovado e iniciado com sucesso.',
      data: sanitizeProject(project),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao aprovar projeto.',
      error: error.message,
    });
  }
}

async function rejectProjectApproval(req, res) {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projeto nao encontrado.',
      });
    }

    if (project.approvalStatus !== 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Somente projetos pendentes podem ser reprovados.',
      });
    }

    const reason = req.body.reason || 'Projeto reprovado.';

    await project.update({
      approvalStatus: 'reprovado',
      rejectedBy: req.userId,
      rejectedAt: new Date(),
      rejectionReason: reason,
    });

    await registerAuditLog({
      entityType: 'project',
      entityId: project.id,
      action: 'project_rejected',
      description: `Projeto ${project.code} reprovado.`,
      userId: req.userId,
      metadata: {
        ...buildProjectMetadata(project),
        reason,
      },
    });

    return res.json({
      success: true,
      message: 'Projeto reprovado com sucesso.',
      data: sanitizeProject(project),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao reprovar projeto.',
      error: error.message,
    });
  }
}
async function deleteProject(req, res) {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projeto nao encontrado.',
      });
    }

    await project.update({ status: 'cancelado' });

    return res.json({
      success: true,
      message: 'Projeto cancelado com sucesso.',
      data: sanitizeProject(project),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao cancelar projeto.',
      error: error.message,
    });
  }
}

module.exports = {
  getAllProjects,
  getProjectStats,
  getProjectById,
  createProject,
  updateProject,
  requestProjectApproval,
  approveProjectApproval,
  rejectProjectApproval,
  deleteProject,
};