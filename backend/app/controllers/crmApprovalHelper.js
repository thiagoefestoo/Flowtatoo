const { registerAuditLog } = require('../services/auditService');

const APPROVAL_ACTION_SUFFIX = {
  pendente: 'approval_requested',
  aprovado: 'approved',
  reprovado: 'rejected',
};

function createApprovalHandlers({ model, include = [], entityType, label }) {
  async function updateApproval(req, res, nextStatus, description, note = null) {
    try {
      const item = await model.findByPk(req.params.id, { include });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: `${label} não encontrada(o).`,
        });
      }

      const previous = item.toJSON();
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

      await item.update(payload);

      await registerAuditLog({
        entityType,
        entityId: item.id,
        action: `${entityType}_${APPROVAL_ACTION_SUFFIX[nextStatus] || `approval_${nextStatus}`}`,
        description,
        userId: req.userId,
        metadata: {
          previous,
          current: item.toJSON(),
          approvalStatus: nextStatus,
          approvalNote: note,
        },
      });

      const refreshed = await model.findByPk(req.params.id, { include });

      return res.json({
        success: true,
        message: description,
        data: refreshed || item,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Erro ao atualizar aprovação de ${label}.`,
        error: error.message,
      });
    }
  }

  return {
    sendToApproval(req, res) {
      return updateApproval(
        req,
        res,
        'pendente',
        `${label} enviada(o) para aprovação.`,
        req.body?.note || 'Aguardando validação do responsável.'
      );
    },

    approve(req, res) {
      return updateApproval(
        req,
        res,
        'aprovado',
        `${label} aprovada(o) com sucesso.`,
        req.body?.note || 'Registro validado e aprovado.'
      );
    },

    reject(req, res) {
      return updateApproval(
        req,
        res,
        'reprovado',
        `${label} reprovada(o).`,
        req.body?.note || 'Registro reprovado para ajuste.'
      );
    },
  };
}

module.exports = createApprovalHandlers;
