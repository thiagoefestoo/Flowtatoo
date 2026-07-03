const { Op } = require('sequelize');

const TattooAppointment = require('../models/tattooAppointment');
const TattooClient = require('../models/tattooClient');
const TattooArtist = require('../models/tattooArtist');

const ACTIVE_STATUSES = ['orcamento', 'aguardando_sinal', 'agendado', 'confirmado', 'em_atendimento', 'reagendado'];
const SEVERITY_ORDER = { urgent: 0, warning: 1, info: 2, success: 3 };

function pad(value) {
  return String(value).padStart(2, '0');
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseISODate(value) {
  const [year, month, day] = String(value || '').split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function addDays(date, amount) {
  const output = new Date(date);
  output.setDate(output.getDate() + amount);
  return output;
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : '--:--';
}

function money(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateTimeValue(date, time = '12:00') {
  return `${date}T${String(time || '12:00').slice(0, 5)}:00`;
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value || '00:00').split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function getEndMinutes(item) {
  if (item.endTime) return timeToMinutes(item.endTime);
  return timeToMinutes(item.startTime) + Number(item.estimatedMinutes || 120);
}

function buildAppointmentAction(item) {
  return `/agenda?date=${item.appointmentDate}&appointment=${item.id}`;
}

function makeAlert({ id, type, severity = 'info', title, message, dueAt, actionPath, actionLabel = 'Abrir', metadata = {} }) {
  return {
    id,
    type,
    severity,
    title,
    message,
    dueAt,
    actionPath,
    actionLabel,
    metadata,
  };
}

function nextBirthdayDate(birthDate, today) {
  if (!birthDate) return null;
  const parsed = parseISODate(birthDate);
  let next = new Date(today.getFullYear(), parsed.getMonth(), parsed.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, parsed.getMonth(), parsed.getDate());
  return next;
}

function buildConflicts(appointments) {
  const grouped = appointments.reduce((acc, item) => {
    const key = `${item.artistId || 'sem-artista'}:${item.appointmentDate}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const alerts = [];

  Object.values(grouped).forEach((items) => {
    const sorted = [...items].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    for (let index = 0; index < sorted.length; index += 1) {
      for (let nextIndex = index + 1; nextIndex < sorted.length; nextIndex += 1) {
        const current = sorted[index];
        const next = sorted[nextIndex];
        const currentStart = timeToMinutes(current.startTime);
        const currentEnd = getEndMinutes(current);
        const nextStart = timeToMinutes(next.startTime);
        const nextEnd = getEndMinutes(next);

        if (nextStart >= currentEnd) break;
        if (currentStart < nextEnd && nextStart < currentEnd) {
          alerts.push(makeAlert({
            id: `schedule-conflict:${current.id}:${next.id}`,
            type: 'schedule',
            severity: 'urgent',
            title: 'Conflito de horários na agenda',
            message: `${formatTime(current.startTime)} ${current.client?.name || current.title} e ${formatTime(next.startTime)} ${next.client?.name || next.title} estão sobrepostos.`,
            dueAt: dateTimeValue(current.appointmentDate, current.startTime),
            actionPath: buildAppointmentAction(current),
            actionLabel: 'Corrigir agenda',
            metadata: { appointmentId: current.id, relatedAppointmentId: next.id, date: current.appointmentDate },
          }));
        }
      }
    }
  });

  return alerts;
}

async function getAlertData() {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const today = toISODate(todayDate);
  const tomorrow = toISODate(addDays(todayDate, 1));
  const threeDays = toISODate(addDays(todayDate, 3));
  const sevenDays = toISODate(addDays(todayDate, 7));
  const fourteenDays = toISODate(addDays(todayDate, 14));
  const thirtyDays = toISODate(addDays(todayDate, 30));
  const sevenDaysAgo = toISODate(addDays(todayDate, -7));
  const threeDaysAgo = toISODate(addDays(todayDate, -3));

  const [appointments, clients] = await Promise.all([
    TattooAppointment.findAll({
      where: {
        appointmentDate: { [Op.between]: [sevenDaysAgo, thirtyDays] },
        status: { [Op.ne]: 'cancelado' },
      },
      include: [
        { model: TattooClient, as: 'client' },
        { model: TattooArtist, as: 'artist' },
      ],
      order: [['appointmentDate', 'ASC'], ['startTime', 'ASC']],
    }),
    TattooClient.findAll({
      where: {
        status: { [Op.ne]: 'inativo' },
        birthDate: { [Op.ne]: null },
      },
      order: [['name', 'ASC']],
    }),
  ]);

  const alerts = [];
  const upcomingActive = appointments.filter((item) => (
    item.appointmentDate >= today
    && ACTIVE_STATUSES.includes(item.status)
  ));

  appointments
    .filter((item) => item.appointmentDate === today && item.status !== 'cancelado')
    .forEach((item) => {
      const confirmed = item.confirmationStatus === 'confirmado';
      alerts.push(makeAlert({
        id: `appointment-today:${item.id}`,
        type: 'appointment',
        severity: confirmed ? 'info' : 'urgent',
        title: `Tattoo hoje às ${formatTime(item.startTime)}`,
        message: `${item.client?.name || 'Cliente'} • ${item.title}${confirmed ? '' : ' • ainda sem confirmação'}`,
        dueAt: dateTimeValue(item.appointmentDate, item.startTime),
        actionPath: buildAppointmentAction(item),
        actionLabel: 'Ver horário',
        metadata: { appointmentId: item.id, date: item.appointmentDate, clientId: item.clientId },
      }));
    });

  upcomingActive
    .filter((item) => item.appointmentDate === tomorrow)
    .forEach((item) => {
      alerts.push(makeAlert({
        id: `appointment-tomorrow:${item.id}`,
        type: 'appointment',
        severity: item.confirmationStatus === 'confirmado' ? 'success' : 'warning',
        title: `Horário amanhã às ${formatTime(item.startTime)}`,
        message: `${item.client?.name || 'Cliente'} • ${item.title}`,
        dueAt: dateTimeValue(item.appointmentDate, item.startTime),
        actionPath: buildAppointmentAction(item),
        actionLabel: 'Preparar sessão',
        metadata: { appointmentId: item.id, date: item.appointmentDate, clientId: item.clientId },
      }));
    });

  upcomingActive
    .filter((item) => item.appointmentDate <= threeDays && item.confirmationStatus !== 'confirmado')
    .forEach((item) => {
      const noResponse = item.confirmationStatus === 'sem_resposta';
      alerts.push(makeAlert({
        id: `confirmation:${item.id}:${item.confirmationStatus}`,
        type: 'confirmation',
        severity: noResponse || item.appointmentDate === today ? 'urgent' : 'warning',
        title: noResponse ? 'Cliente não respondeu' : 'Confirmação pendente',
        message: `${item.client?.name || 'Cliente'} • ${item.appointmentDate} às ${formatTime(item.startTime)}`,
        dueAt: dateTimeValue(item.appointmentDate, item.startTime),
        actionPath: buildAppointmentAction(item),
        actionLabel: 'Confirmar horário',
        metadata: { appointmentId: item.id, date: item.appointmentDate, confirmationStatus: item.confirmationStatus },
      }));
    });

  appointments
    .filter((item) => {
      if (item.paymentStatus === 'pago' || item.paymentStatus === 'cancelado') return false;
      const balance = Math.max(money(item.price) - money(item.paidAmount), 0);
      if (balance <= 0) return false;
      const upcomingDue = item.appointmentDate >= today && item.appointmentDate <= sevenDays && ACTIVE_STATUSES.includes(item.status);
      const overdueDue = item.appointmentDate < today && item.appointmentDate >= sevenDaysAgo && item.status === 'finalizado';
      return upcomingDue || overdueDue;
    })
    .forEach((item) => {
      const balance = Math.max(money(item.price) - money(item.paidAmount), 0);
      const overdue = item.appointmentDate < today;
      alerts.push(makeAlert({
        id: `payment:${item.id}:${money(item.paidAmount)}`,
        type: 'payment',
        severity: overdue || item.appointmentDate <= tomorrow ? 'urgent' : 'warning',
        title: overdue ? 'Pagamento atrasado' : 'Pagamento em aberto',
        message: `${item.client?.name || 'Cliente'} ainda possui saldo de R$ ${balance.toFixed(2).replace('.', ',')}.`,
        dueAt: dateTimeValue(item.appointmentDate, item.startTime),
        actionPath: buildAppointmentAction(item),
        actionLabel: 'Registrar pagamento',
        metadata: { appointmentId: item.id, date: item.appointmentDate, balance },
      }));
    });

  appointments
    .filter((item) => item.status === 'finalizado' && item.appointmentDate >= threeDaysAgo && item.appointmentDate <= today && !item.careInstructionsSent)
    .forEach((item) => {
      alerts.push(makeAlert({
        id: `aftercare:${item.id}`,
        type: 'aftercare',
        severity: 'info',
        title: 'Enviar cuidados pós-tattoo',
        message: `${item.client?.name || 'Cliente'} finalizou “${item.title}” e ainda não recebeu os cuidados registrados.`,
        dueAt: dateTimeValue(item.appointmentDate, item.endTime || item.startTime),
        actionPath: buildAppointmentAction(item),
        actionLabel: 'Abrir atendimento',
        metadata: { appointmentId: item.id, date: item.appointmentDate, clientId: item.clientId },
      }));
    });

  upcomingActive
    .filter((item) => item.appointmentDate <= fourteenDays && ['alta', 'urgente'].includes(item.priority))
    .forEach((item) => {
      alerts.push(makeAlert({
        id: `priority:${item.id}:${item.priority}`,
        type: 'priority',
        severity: item.priority === 'urgente' ? 'urgent' : 'warning',
        title: item.priority === 'urgente' ? 'Sessão marcada como urgente' : 'Sessão de alta prioridade',
        message: `${item.client?.name || 'Cliente'} • ${item.title} • ${item.appointmentDate} às ${formatTime(item.startTime)}`,
        dueAt: dateTimeValue(item.appointmentDate, item.startTime),
        actionPath: buildAppointmentAction(item),
        actionLabel: 'Ver detalhes',
        metadata: { appointmentId: item.id, date: item.appointmentDate, priority: item.priority },
      }));
    });

  alerts.push(...buildConflicts(upcomingActive));

  clients.forEach((client) => {
    const nextBirthday = nextBirthdayDate(client.birthDate, todayDate);
    if (!nextBirthday || nextBirthday > addDays(todayDate, 7)) return;
    const birthdayDate = toISODate(nextBirthday);
    const isToday = birthdayDate === today;
    alerts.push(makeAlert({
      id: `birthday:${client.id}:${birthdayDate}`,
      type: 'birthday',
      severity: isToday ? 'success' : 'info',
      title: isToday ? `Aniversário de ${client.name} hoje` : `Aniversário de ${client.name} chegando`,
      message: isToday ? 'Uma ótima oportunidade para enviar uma mensagem especial.' : `Aniversário em ${birthdayDate}.`,
      dueAt: dateTimeValue(birthdayDate, '09:00'),
      actionPath: '/clientes',
      actionLabel: 'Ver cliente',
      metadata: { clientId: client.id, date: birthdayDate },
    }));
  });

  const uniqueAlerts = Array.from(new Map(alerts.map((alert) => [alert.id, alert])).values());
  uniqueAlerts.sort((a, b) => {
    const severityDifference = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
    if (severityDifference !== 0) return severityDifference;
    return String(a.dueAt || '').localeCompare(String(b.dueAt || ''));
  });

  const countType = (type) => uniqueAlerts.filter((alert) => alert.type === type).length;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      total: uniqueAlerts.length,
      urgentCount: uniqueAlerts.filter((alert) => alert.severity === 'urgent').length,
      warningCount: uniqueAlerts.filter((alert) => alert.severity === 'warning').length,
      todayCount: uniqueAlerts.filter((alert) => alert.type === 'appointment' && alert.metadata?.date === today).length,
      confirmationCount: countType('confirmation'),
      paymentCount: countType('payment'),
      scheduleCount: countType('schedule'),
      birthdayCount: countType('birthday'),
      aftercareCount: countType('aftercare'),
    },
    alerts: uniqueAlerts,
  };
}

async function getAlertsSummary(req, res) {
  try {
    const alertData = await getAlertData();
    return res.json({ success: true, data: alertData.summary });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao carregar resumo de alertas do Flowtatoo.',
      error: error.message,
    });
  }
}

async function getAlertsDetails(req, res) {
  try {
    const alertData = await getAlertData();
    return res.json({ success: true, data: alertData });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao carregar alertas do Flowtatoo.',
      error: error.message,
    });
  }
}

module.exports = {
  getAlertsSummary,
  getAlertsDetails,
};
