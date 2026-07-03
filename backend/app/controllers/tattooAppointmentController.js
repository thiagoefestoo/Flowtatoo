const { Op } = require('sequelize');
const TattooAppointment = require('../models/tattooAppointment');
const TattooClient = require('../models/tattooClient');
const TattooArtist = require('../models/tattooArtist');
const { registerAuditLog } = require('../services/auditService');

const include = [
  { model: TattooClient, as: 'client' },
  { model: TattooArtist, as: 'artist' },
];

function cleanPayload(payload) {
  const output = { ...payload };
  Object.keys(output).forEach((key) => {
    if (output[key] === '') output[key] = null;
  });
  return output;
}

function toMoney(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePaymentPayload(payload = {}, current = {}) {
  const price = payload.price !== undefined ? toMoney(payload.price) : toMoney(current.price);
  const deposit = payload.deposit !== undefined ? toMoney(payload.deposit) : toMoney(current.deposit);
  const paidAmount = payload.paidAmount !== undefined ? toMoney(payload.paidAmount) : toMoney(current.paidAmount);

  if (payload.paidAmount === undefined && payload.deposit !== undefined && deposit > 0) {
    payload.paidAmount = deposit;
  }

  const effectivePaid = payload.paidAmount !== undefined ? toMoney(payload.paidAmount) : paidAmount;

  if (!payload.paymentStatus || payload.paymentStatus === 'pendente' || payload.paymentStatus === 'sinal_pago' || payload.paymentStatus === 'parcial') {
    if (price > 0 && effectivePaid >= price) {
      payload.paymentStatus = 'pago';
    } else if (effectivePaid > 0) {
      payload.paymentStatus = deposit > 0 && effectivePaid <= deposit ? 'sinal_pago' : 'parcial';
    } else {
      payload.paymentStatus = 'pendente';
    }
  }

  if (!payload.paymentMethod) {
    payload.paymentMethod = current.paymentMethod || 'nao_informado';
  }

  return payload;
}

function addMinutesToTime(timeValue, minutes) {
  if (!timeValue) return null;
  const [hours, mins] = String(timeValue).split(':').map((item) => Number(item || 0));
  const date = new Date(2000, 0, 1, hours, mins, 0);
  date.setMinutes(date.getMinutes() + Number(minutes || 120));
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
}

function buildWhere(query = {}) {
  const where = {};

  if (query.startDate || query.endDate) {
    where.appointmentDate = {};
    if (query.startDate) where.appointmentDate[Op.gte] = query.startDate;
    if (query.endDate) where.appointmentDate[Op.lte] = query.endDate;
  }

  ['clientId', 'artistId', 'status', 'confirmationStatus', 'paymentStatus', 'serviceType'].forEach((field) => {
    if (query[field]) where[field] = query[field];
  });

  if (query.q) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${query.q}%` } },
      { style: { [Op.iLike]: `%${query.q}%` } },
      { bodyArea: { [Op.iLike]: `%${query.q}%` } },
      { notes: { [Op.iLike]: `%${query.q}%` } },
    ];
  }

  return where;
}

async function getAll(req, res) {
  try {
    const data = await TattooAppointment.findAll({
      where: buildWhere(req.query || {}),
      include,
      order: [['appointmentDate', 'ASC'], ['startTime', 'ASC']],
    });

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar agendamentos.', error: error.message });
  }
}

async function getById(req, res) {
  try {
    const item = await TattooAppointment.findByPk(req.params.id, { include });
    if (!item) return res.status(404).json({ success: false, message: 'Agendamento nao encontrado.' });
    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar agendamento.', error: error.message });
  }
}

async function create(req, res) {
  try {
    const payload = cleanPayload(req.body || {});
    const requiredFields = ['clientId', 'artistId', 'title', 'appointmentDate', 'startTime'];

    for (const field of requiredFields) {
      if (!payload[field]) {
        return res.status(400).json({ success: false, message: `Campo obrigatorio nao informado: ${field}.` });
      }
    }

    const client = await TattooClient.findByPk(payload.clientId);
    const artist = await TattooArtist.findByPk(payload.artistId);

    if (!client) return res.status(400).json({ success: false, message: 'Cliente selecionado nao encontrado. Cadastre o cliente primeiro.' });
    if (!artist) return res.status(400).json({ success: false, message: 'Tatuador selecionado nao encontrado. Cadastre o tatuador primeiro.' });

    if (!payload.endTime && payload.startTime) {
      payload.endTime = addMinutesToTime(payload.startTime, payload.estimatedMinutes || 120);
    }

    normalizePaymentPayload(payload);

    const item = await TattooAppointment.create(payload);
    const data = await TattooAppointment.findByPk(item.id, { include });

    await registerAuditLog({
      entityType: 'tattoo_appointment',
      entityId: item.id,
      action: 'tattoo_appointment_created',
      description: 'Agendamento de tattoo criado.',
      userId: req.userId,
      metadata: data.toJSON(),
    });

    return res.status(201).json({ success: true, message: 'Agendamento criado com sucesso.', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao criar agendamento.', error: error.message });
  }
}

async function update(req, res) {
  try {
    const item = await TattooAppointment.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Agendamento nao encontrado.' });

    const previous = item.toJSON();
    const payload = cleanPayload(req.body || {});

    if (payload.clientId) {
      const client = await TattooClient.findByPk(payload.clientId);
      if (!client) return res.status(400).json({ success: false, message: 'Cliente selecionado nao encontrado.' });
    }

    if (payload.artistId) {
      const artist = await TattooArtist.findByPk(payload.artistId);
      if (!artist) return res.status(400).json({ success: false, message: 'Tatuador selecionado nao encontrado.' });
    }

    if (!payload.endTime && (payload.startTime || payload.estimatedMinutes)) {
      payload.endTime = addMinutesToTime(payload.startTime || item.startTime, payload.estimatedMinutes || item.estimatedMinutes || 120);
    }

    normalizePaymentPayload(payload, item.toJSON());

    await item.update(payload);
    const data = await TattooAppointment.findByPk(item.id, { include });

    await registerAuditLog({
      entityType: 'tattoo_appointment',
      entityId: item.id,
      action: 'tattoo_appointment_updated',
      description: 'Agendamento de tattoo atualizado.',
      userId: req.userId,
      metadata: { previous, current: data.toJSON() },
    });

    return res.json({ success: true, message: 'Agendamento atualizado com sucesso.', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao atualizar agendamento.', error: error.message });
  }
}

async function remove(req, res) {
  try {
    const item = await TattooAppointment.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Agendamento nao encontrado.' });

    const metadata = item.toJSON();
    await item.destroy();

    await registerAuditLog({
      entityType: 'tattoo_appointment',
      entityId: req.params.id,
      action: 'tattoo_appointment_deleted',
      description: 'Agendamento de tattoo excluido.',
      userId: req.userId,
      metadata,
    });

    return res.json({ success: true, message: 'Agendamento excluido com sucesso.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao excluir agendamento.', error: error.message });
  }
}

async function updateStatus(req, res) {
  try {
    const item = await TattooAppointment.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Agendamento nao encontrado.' });

    const payload = {};
    ['status', 'confirmationStatus', 'paymentStatus', 'careInstructionsSent', 'paidAmount', 'deposit', 'paymentMethod', 'paymentNotes'].forEach((field) => {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    });

    normalizePaymentPayload(payload, item.toJSON());

    await item.update(payload);
    const data = await TattooAppointment.findByPk(item.id, { include });

    return res.json({ success: true, message: 'Status atualizado com sucesso.', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao atualizar status.', error: error.message });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  updateStatus,
};
