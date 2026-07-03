const createCrudController = require('./crmCrudFactory');
const Activity = require('../models/activity');
const Customer = require('../models/customer');
const Lead = require('../models/lead');
const Opportunity = require('../models/opportunity');
const User = require('../models/user');
const { registerAuditLog } = require('../services/auditService');

const include = [
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'tradeName'] },
  { model: Lead, as: 'lead', attributes: ['id', 'name', 'company'] },
  { model: Opportunity, as: 'opportunity', attributes: ['id', 'title', 'stage', 'value'] },
  { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
];

const controller = createCrudController({
  model: Activity,
  entityType: 'crm_activity',
  label: 'atividade',
  requiredFields: ['title', 'document'],
  searchFields: ['title', 'document', 'description', 'result'],
  include,
});

async function updateApproval(req, res, nextStatus, description, note = null) {
  try {
    const activity = await Activity.findByPk(req.params.id, { include });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Atividade não encontrada.',
      });
    }

    const previous = activity.toJSON();
    const now = new Date();

    const payload = {
      approvalStatus: nextStatus,
      approvalNote: note,
    };

    if (nextStatus === 'pendente') {
      payload.approvalRequestedAt = now;
      payload.approvalDecidedAt = null;
      payload.approvedById = null;
    }

    if (['aprovado', 'reprovado'].includes(nextStatus)) {
      payload.approvalDecidedAt = now;
      payload.approvedById = req.userId;
    }

    await activity.update(payload);

    await registerAuditLog({
      entityType: 'crm_activity',
      entityId: activity.id,
      action: `crm_activity_approval_${nextStatus}`,
      description,
      userId: req.userId,
      metadata: {
        previous,
        current: activity.toJSON(),
      },
    });

    return res.json({
      success: true,
      message: description,
      data: activity,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar aprovação da atividade.',
      error: error.message,
    });
  }
}

async function sendToApproval(req, res) {
  return updateApproval(
    req,
    res,
    'pendente',
    'Atividade enviada para aprovação.',
    req.body?.note || 'Aguardando validação do responsável.'
  );
}

async function approve(req, res) {
  return updateApproval(
    req,
    res,
    'aprovado',
    'Atividade aprovada com sucesso.',
    req.body?.note || 'Atividade validada e aprovada.'
  );
}

async function reject(req, res) {
  return updateApproval(
    req,
    res,
    'reprovado',
    'Atividade reprovada.',
    req.body?.note || 'Atividade reprovada para ajuste.'
  );
}

module.exports = {
  ...controller,
  sendToApproval,
  approve,
  reject,
};
