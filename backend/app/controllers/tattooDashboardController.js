const { Op, fn, col, literal } = require('sequelize');
const TattooAppointment = require('../models/tattooAppointment');
const TattooClient = require('../models/tattooClient');
const TattooArtist = require('../models/tattooArtist');

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(base, days) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function normalizeCurrency(value) {
  return Number(value || 0);
}

function buildPeriod(query = {}) {
  const today = new Date();
  const days = Number(query.days || 30);
  const startDate = query.startDate || toISODate(addDays(today, -days));
  const endDate = query.endDate || toISODate(addDays(today, 45));
  return { startDate, endDate };
}

async function publicSummary(req, res) {
  try {
    const today = toISODate(new Date());
    const tomorrow = toISODate(addDays(new Date(), 1));

    const [appointmentsToday, appointmentsTomorrow, clients, artists] = await Promise.all([
      TattooAppointment.count({ where: { appointmentDate: today } }),
      TattooAppointment.count({ where: { appointmentDate: tomorrow } }),
      TattooClient.count(),
      TattooArtist.count({ where: { status: 'ativo' } }),
    ]);

    return res.json({
      success: true,
      data: {
        counters: { appointmentsToday, appointmentsTomorrow, clients, artists },
        cards: {
          priority: { label: 'Agenda de hoje', title: `${appointmentsToday} horários`, detail: 'Tattoos e avaliações marcadas para hoje' },
          next: { label: 'Amanhã', title: `${appointmentsTomorrow} horários`, detail: 'Prepare confirmação, materiais e bancada' },
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao carregar resumo publico.', error: error.message });
  }
}

async function summary(req, res) {
  try {
    const today = toISODate(new Date());
    const tomorrow = toISODate(addDays(new Date(), 1));
    const nextWeek = toISODate(addDays(new Date(), 7));
    const monthStart = toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const monthEnd = toISODate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));

    const [
      appointmentsToday,
      appointmentsTomorrow,
      next7Days,
      pendingConfirmations,
      pendingDeposits,
      activeClients,
      activeArtists,
      finalizedMonth,
      paidMonth,
      openBalanceMonth,
      partialPayments,
      fullyPaidMonth,
      nextAppointments,
    ] = await Promise.all([
      TattooAppointment.count({ where: { appointmentDate: today } }),
      TattooAppointment.count({ where: { appointmentDate: tomorrow } }),
      TattooAppointment.count({ where: { appointmentDate: { [Op.between]: [today, nextWeek] }, status: { [Op.notIn]: ['cancelado', 'finalizado'] } } }),
      TattooAppointment.count({ where: { appointmentDate: { [Op.gte]: today }, confirmationStatus: { [Op.ne]: 'confirmado' }, status: { [Op.notIn]: ['cancelado', 'finalizado'] } } }),
      TattooAppointment.count({ where: { appointmentDate: { [Op.gte]: today }, paymentStatus: 'pendente', status: { [Op.in]: ['aguardando_sinal', 'agendado', 'confirmado'] } } }),
      TattooClient.count({ where: { status: { [Op.ne]: 'inativo' } } }),
      TattooArtist.count({ where: { status: 'ativo' } }),
      TattooAppointment.sum('price', { where: { appointmentDate: { [Op.between]: [monthStart, monthEnd] }, status: 'finalizado' } }),
      TattooAppointment.sum('paidAmount', { where: { appointmentDate: { [Op.between]: [monthStart, monthEnd] }, paymentStatus: { [Op.in]: ['sinal_pago', 'parcial', 'pago'] } } }),
      TattooAppointment.findAll({ where: { appointmentDate: { [Op.between]: [monthStart, monthEnd] }, status: { [Op.notIn]: ['cancelado'] } }, attributes: ['price', 'paidAmount'] }),
      TattooAppointment.count({ where: { appointmentDate: { [Op.between]: [monthStart, monthEnd] }, paymentStatus: { [Op.in]: ['sinal_pago', 'parcial'] } } }),
      TattooAppointment.count({ where: { appointmentDate: { [Op.between]: [monthStart, monthEnd] }, paymentStatus: 'pago' } }),
      TattooAppointment.findAll({
        where: { appointmentDate: { [Op.gte]: today }, status: { [Op.notIn]: ['cancelado', 'finalizado'] } },
        include: [{ model: TattooClient, as: 'client' }, { model: TattooArtist, as: 'artist' }],
        order: [['appointmentDate', 'ASC'], ['startTime', 'ASC']],
        limit: 8,
      }),
    ]);

    const openBalance = (openBalanceMonth || []).reduce((sum, item) => {
      const price = normalizeCurrency(item.price);
      const paidAmount = normalizeCurrency(item.paidAmount);
      return sum + Math.max(price - paidAmount, 0);
    }, 0);

    return res.json({
      success: true,
      data: {
        counters: {
          appointmentsToday,
          appointmentsTomorrow,
          next7Days,
          pendingConfirmations,
          pendingDeposits,
          activeClients,
          activeArtists,
          revenueMonth: normalizeCurrency(finalizedMonth),
          paidMonth: normalizeCurrency(paidMonth),
          openBalanceMonth: normalizeCurrency(openBalance),
          partialPayments,
          fullyPaidMonth,
        },
        alerts: {
          today: appointmentsToday,
          tomorrow: appointmentsTomorrow,
          confirmations: pendingConfirmations,
          deposits: pendingDeposits,
        },
        nextAppointments,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao carregar dashboard tattoo.', error: error.message });
  }
}

async function bi(req, res) {
  try {
    const { startDate, endDate } = buildPeriod(req.query || {});
    const where = { appointmentDate: { [Op.between]: [startDate, endDate] } };

    const [appointments, byDay, byStatus, byService, byArtist, totalClients] = await Promise.all([
      TattooAppointment.findAll({ where, include: [{ model: TattooClient, as: 'client' }, { model: TattooArtist, as: 'artist' }], order: [['appointmentDate', 'ASC']] }),
      TattooAppointment.findAll({
        where,
        attributes: [
          ['appointment_date', 'date'],
          [fn('COUNT', col('id')), 'total'],
          [fn('SUM', literal("CASE WHEN status = 'finalizado' THEN COALESCE(price, 0) ELSE 0 END")), 'revenue'],
          [fn('SUM', literal("COALESCE(paid_amount, 0)")), 'paid'],
          [fn('SUM', literal("GREATEST(COALESCE(price, 0) - COALESCE(paid_amount, 0), 0)")), 'openBalance'],
        ],
        group: ['appointment_date'],
        order: [['appointmentDate', 'ASC']],
        raw: true,
      }),
      TattooAppointment.findAll({ where, attributes: ['status', [fn('COUNT', col('id')), 'total']], group: ['status'], raw: true }),
      TattooAppointment.findAll({ where, attributes: ['serviceType', [fn('COUNT', col('id')), 'total']], group: ['serviceType'], raw: true }),
      TattooAppointment.findAll({
        where,
        attributes: ['artistId', [fn('COUNT', col('TattooAppointment.id')), 'total'], [fn('SUM', col('price')), 'revenue']],
        include: [{ model: TattooArtist, as: 'artist', attributes: ['name', 'color'] }],
        group: ['artistId', 'artist.id'],
        order: [[literal('total'), 'DESC']],
      }),
      TattooClient.count(),
    ]);

    const totalAppointments = appointments.length;
    const finalized = appointments.filter((item) => item.status === 'finalizado');
    const cancelled = appointments.filter((item) => item.status === 'cancelado');
    const revenue = finalized.reduce((sum, item) => sum + normalizeCurrency(item.price), 0);
    const deposits = appointments.reduce((sum, item) => sum + normalizeCurrency(item.deposit), 0);
    const paid = appointments.reduce((sum, item) => sum + normalizeCurrency(item.paidAmount), 0);
    const openBalance = appointments.reduce((sum, item) => sum + Math.max(normalizeCurrency(item.price) - normalizeCurrency(item.paidAmount), 0), 0);
    const fullyPaid = appointments.filter((item) => item.paymentStatus === 'pago').length;
    const partialPayments = appointments.filter((item) => ['sinal_pago', 'parcial'].includes(item.paymentStatus)).length;
    const pendingPayments = appointments.filter((item) => item.paymentStatus === 'pendente').length;
    const averageTicket = finalized.length ? revenue / finalized.length : 0;

    return res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        counters: {
          totalAppointments,
          finalized: finalized.length,
          cancelled: cancelled.length,
          revenue,
          deposits,
          paid,
          openBalance,
          fullyPaid,
          partialPayments,
          pendingPayments,
          averageTicket,
          totalClients,
          conversionRate: totalAppointments ? Math.round((finalized.length / totalAppointments) * 100) : 0,
          cancellationRate: totalAppointments ? Math.round((cancelled.length / totalAppointments) * 100) : 0,
        },
        byDay,
        byStatus,
        byService,
        byArtist,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao carregar BI tattoo.', error: error.message });
  }
}

module.exports = { publicSummary, summary, bi };
