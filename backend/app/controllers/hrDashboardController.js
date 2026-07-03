const { Op } = require('sequelize');

const JobOpening = require('../models/jobOpening');
const Candidate = require('../models/candidate');
const RecruitmentProcess = require('../models/recruitmentProcess');
const Interview = require('../models/interview');
const Admission = require('../models/admission');
const Employee = require('../models/employee');
const HrDocument = require('../models/hrDocument');
const TimeOffRequest = require('../models/timeOffRequest');
const Termination = require('../models/termination');
const OnboardingTask = require('../models/onboardingTask');
const TalentPool = require('../models/talentPool');

async function buildSummary() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextSevenDays = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    openJobs,
    candidatesInProcess,
    scheduledInterviews,
    interviewsToday,
    pendingAdmissions,
    activeEmployees,
    pendingDocuments,
    activeOnboarding,
    timeOffUpcoming,
    terminationsInProgress,
    talentPoolCount,
  ] = await Promise.all([
    JobOpening.count({ where: { status: { [Op.in]: ['aberta', 'triagem', 'entrevistas', 'proposta', 'admissao'] } } }),
    Candidate.count({ where: { status: { [Op.in]: ['novo', 'em_triagem', 'em_processo', 'aprovado'] } } }),
    Interview.count({ where: { status: { [Op.in]: ['agendada', 'confirmada', 'remarcada'] } } }),
    Interview.count({ where: { scheduledAt: { [Op.gte]: todayStart, [Op.lt]: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) } } }),
    Admission.count({ where: { status: { [Op.notIn]: ['concluida', 'cancelada'] } } }),
    Employee.count({ where: { status: { [Op.in]: ['ativo', 'experiencia', 'afastado', 'ferias'] } } }),
    HrDocument.count({ where: { status: { [Op.in]: ['pendente', 'enviado', 'recusado', 'vencido'] } } }),
    OnboardingTask.count({ where: { status: { [Op.in]: ['pendente', 'em_andamento', 'atrasada'] } } }),
    TimeOffRequest.count({ where: { startDate: { [Op.gte]: todayStart, [Op.lte]: nextSevenDays }, status: { [Op.in]: ['solicitado', 'em_analise', 'aprovado'] } } }),
    Termination.count({ where: { status: { [Op.notIn]: ['concluido', 'cancelado'] } } }),
    TalentPool.count({ where: { status: { [Op.in]: ['ativo', 'em_contato', 'reservado'] } } }),
  ]);

  const nextInterviews = await Interview.findAll({
    where: { scheduledAt: { [Op.gte]: todayStart }, status: { [Op.in]: ['agendada', 'confirmada', 'remarcada'] } },
    order: [['scheduledAt', 'ASC']],
    limit: 5,
  });

  const priorityJobs = await JobOpening.findAll({
    where: { priority: { [Op.in]: ['alta', 'urgente'] }, status: { [Op.notIn]: ['concluida', 'cancelada'] } },
    order: [['updatedAt', 'DESC']],
    limit: 5,
  });

  return {
    updatedAt: new Date().toISOString(),
    counters: {
      openJobs,
      candidatesInProcess,
      scheduledInterviews,
      interviewsToday,
      pendingAdmissions,
      activeEmployees,
      pendingDocuments,
      activeOnboarding,
      timeOffUpcoming,
      terminationsInProgress,
      talentPoolCount,
    },
    nextInterviews,
    priorityJobs,
  };
}

async function getSummary(req, res) {
  try {
    return res.json({ success: true, data: await buildSummary() });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao carregar dashboard de RH.',
      error: error.message,
    });
  }
}

async function getPublicSummary(req, res) {
  try {
    const summary = await buildSummary();
    return res.json({
      success: true,
      data: {
        updatedAt: summary.updatedAt,
        steps: {
          jobs: summary.counters.openJobs,
          candidates: summary.counters.candidatesInProcess,
          interviews: summary.counters.scheduledInterviews,
          admissions: summary.counters.pendingAdmissions,
        },
        stats: {
          activeEmployees: summary.counters.activeEmployees,
          pendingDocuments: summary.counters.pendingDocuments,
          interviewsToday: summary.counters.interviewsToday,
        },
        cards: {
          priority: summary.priorityJobs[0]
            ? {
                label: 'Vaga prioritária',
                title: summary.priorityJobs[0].title,
                detail: `${summary.priorityJobs[0].department || 'Setor'} • ${summary.priorityJobs[0].status}`,
              }
            : {
                label: 'Vaga prioritária',
                title: 'Nenhuma vaga crítica',
                detail: 'Vagas urgentes aparecerão aqui',
              },
          interview: summary.nextInterviews[0]
            ? {
                label: 'Próxima entrevista',
                title: summary.nextInterviews[0].candidateName,
                detail: `${summary.nextInterviews[0].jobTitle} • ${new Date(summary.nextInterviews[0].scheduledAt).toLocaleString('pt-BR')}`,
              }
            : {
                label: 'Próxima entrevista',
                title: 'Nenhuma entrevista agendada',
                detail: 'Agendamentos aparecerão neste painel',
              },
        },
      },
    });
  } catch (error) {
    return res.json({
      success: true,
      data: {
        steps: { jobs: 0, candidates: 0, interviews: 0, admissions: 0 },
        stats: { activeEmployees: 0, pendingDocuments: 0, interviewsToday: 0 },
        cards: {
          priority: { label: 'Vaga prioritária', title: 'Flowtatoo online', detail: 'Sistema pronto para iniciar o RH' },
          interview: { label: 'Próxima entrevista', title: 'Agenda disponível', detail: 'Cadastre entrevistas para visualizar' },
        },
      },
    });
  }
}

module.exports = { getSummary, getPublicSummary };
