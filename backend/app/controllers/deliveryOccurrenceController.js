const { Op } = require('sequelize');

const DeliveryOccurrence = require('../models/deliveryOccurrence');
const Delivery = require('../models/delivery');
const Customer = require('../models/customer');
const User = require('../models/user');
const { registerAuditLog } = require('../services/auditService');

const occurrenceInclude = [
  {
    model: Delivery,
    as: 'delivery',
    attributes: ['id', 'title', 'orderNumber', 'status', 'city', 'state', 'driverId'],
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'tradeName'] }],
  },
  { model: User, as: 'registeredBy', attributes: ['id', 'name', 'email', 'role'] },
];

async function getAllOccurrences(req, res) {
  try {
    const { q, type, severity, status, deliveryId } = req.query;
    const where = {};

    if (q) {
      where[Op.or] = [
        { description: { [Op.iLike]: `%${q}%` } },
        { solution: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (deliveryId) where.deliveryId = deliveryId;

    const occurrences = await DeliveryOccurrence.findAll({
      where,
      include: occurrenceInclude,
      order: [['createdAt', 'DESC']],
    });

    const data = req.user?.role === 'entregador'
      ? occurrences.filter((item) => item.delivery?.driverId === req.userId)
      : occurrences;

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar ocorrências.', error: error.message });
  }
}

async function createOccurrence(req, res) {
  try {
    const { deliveryId, type = 'outro', severity = 'media', status = 'aberta', description, solution } = req.body;

    if (!deliveryId) {
      return res.status(400).json({ success: false, message: 'Selecione a entrega vinculada à ocorrência.' });
    }

    if (!description) {
      return res.status(400).json({ success: false, message: 'Descreva a ocorrência.' });
    }

    const delivery = await Delivery.findByPk(deliveryId);

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Entrega não encontrada.' });
    }

    if (req.user?.role === 'entregador' && delivery.driverId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Você só pode registrar ocorrência para entregas atribuídas ao seu usuário.' });
    }

    const occurrence = await DeliveryOccurrence.create({
      deliveryId,
      type,
      severity,
      status,
      description,
      solution: solution || null,
      registeredById: req.userId,
      resolvedAt: status === 'resolvida' ? new Date() : null,
    });

    await registerAuditLog({
      entityType: 'delivery_occurrence',
      entityId: occurrence.id,
      action: 'delivery_occurrence_created',
      description: `Ocorrência registrada para a entrega ${delivery.title}.`,
      userId: req.userId,
      metadata: {
        deliveryId,
        deliveryTitle: delivery.title,
        type,
        severity,
        status,
        description,
        solution: solution || null,
      },
    });

    const created = await DeliveryOccurrence.findByPk(occurrence.id, { include: occurrenceInclude });
    return res.status(201).json({ success: true, message: 'Ocorrência registrada com sucesso.', data: created });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao registrar ocorrência.', error: error.message });
  }
}

async function updateOccurrence(req, res) {
  try {
    const occurrence = await DeliveryOccurrence.findByPk(req.params.id, { include: occurrenceInclude });

    if (!occurrence) {
      return res.status(404).json({ success: false, message: 'Ocorrência não encontrada.' });
    }

    if (req.user?.role === 'entregador' && occurrence.delivery?.driverId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Você não possui acesso a esta ocorrência.' });
    }

    const payload = { ...req.body };

    if (payload.status === 'resolvida' && !occurrence.resolvedAt) {
      payload.resolvedAt = new Date();
    }

    if (payload.status && payload.status !== 'resolvida') {
      payload.resolvedAt = null;
    }

    await occurrence.update(payload);

    await registerAuditLog({
      entityType: 'delivery_occurrence',
      entityId: occurrence.id,
      action: 'delivery_occurrence_updated',
      description: 'Ocorrência de entrega atualizada.',
      userId: req.userId,
      metadata: occurrence.toJSON(),
    });

    const updated = await DeliveryOccurrence.findByPk(occurrence.id, { include: occurrenceInclude });
    return res.json({ success: true, message: 'Ocorrência atualizada com sucesso.', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao atualizar ocorrência.', error: error.message });
  }
}

async function deleteOccurrence(req, res) {
  try {
    const occurrence = await DeliveryOccurrence.findByPk(req.params.id);

    if (!occurrence) {
      return res.status(404).json({ success: false, message: 'Ocorrência não encontrada.' });
    }

    await occurrence.destroy();

    await registerAuditLog({
      entityType: 'delivery_occurrence',
      entityId: req.params.id,
      action: 'delivery_occurrence_deleted',
      description: 'Ocorrência de entrega excluída.',
      userId: req.userId,
      metadata: occurrence.toJSON(),
    });

    return res.json({ success: true, message: 'Ocorrência excluída com sucesso.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao excluir ocorrência.', error: error.message });
  }
}

module.exports = {
  getAllOccurrences,
  createOccurrence,
  updateOccurrence,
  deleteOccurrence,
};
