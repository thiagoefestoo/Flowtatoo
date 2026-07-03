const { Op } = require('sequelize');

const JobOpening = require('../models/jobOpening');
const Candidate = require('../models/candidate');
const CandidateDocument = require('../models/candidateDocument');
const RecruitmentProcess = require('../models/recruitmentProcess');
const Interview = require('../models/interview');
const Admission = require('../models/admission');
const Employee = require('../models/employee');
const HrDocument = require('../models/hrDocument');
const HrProposal = require('../models/hrProposal');
const TalentPool = require('../models/talentPool');
const OnboardingTask = require('../models/onboardingTask');
const TimeOffRequest = require('../models/timeOffRequest');
const Termination = require('../models/termination');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const parsed = new Date(date);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function endOfDay(date) {
  const parsed = new Date(date);
  parsed.setHours(23, 59, 59, 999);
  return parsed;
}

function addDays(date, amount) {
  const parsed = new Date(date);
  parsed.setDate(parsed.getDate() + amount);
  return parsed;
}

function toDateInput(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function toDayKey(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function parseRange(query = {}) {
  const allowedPeriods = [7, 15, 30, 60, 90, 180, 365];
  const requestedPeriod = Number(query.period || 90);
  const period = allowedPeriods.includes(requestedPeriod) ? requestedPeriod : 90;
  const end = query.end ? endOfDay(query.end) : endOfDay(new Date());
  const start = query.start ? startOfDay(query.start) : startOfDay(addDays(end, (period - 1) * -1));

  return {
    start,
    end,
    startDate: toDateInput(start),
    endDate: toDateInput(end),
    period,
  };
}

function buildDateSeries(start, end) {
  const series = [];
  const cursor = startOfDay(start);
  const last = startOfDay(end);

  while (cursor <= last) {
    series.push({
      date: toDayKey(cursor),
      candidates: 0,
      processes: 0,
      interviews: 0,
      proposals: 0,
      admissions: 0,
      documents: 0,
      employees: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return series;
}

function incrementSeries(seriesMap, value, field) {
  const key = toDayKey(value);
  if (key && seriesMap.has(key)) {
    const item = seriesMap.get(key);
    item[field] += 1;
  }
}

function cleanLabel(value) {
  if (!value) return 'Não informado';
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function countBy(items, fieldName, limit = 8) {
  const map = new Map();

  items.forEach((item) => {
    const label = cleanLabel(item[fieldName]);
    map.set(label, (map.get(label) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function countByGetter(items, getter, limit = 8) {
  const map = new Map();

  items.forEach((item) => {
    const label = cleanLabel(getter(item));
    map.set(label, (map.get(label) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function average(items, fieldName) {
  const values = items
    .map((item) => Number(item[fieldName]))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function percentage(part, total) {
  if (!total) return 0;
  return Math.round((Number(part || 0) / Number(total || 1)) * 1000) / 10;
}

function rangeFilter(fieldName, range) {
  return {
    [fieldName]: {
      [Op.gte]: range.start,
      [Op.lte]: range.end,
    },
  };
}

async function getManagerialBI(req, res) {
  try {
    const range = parseRange(req.query);
    const now = new Date();
    const today = startOfDay(now);
    const inSevenDays = endOfDay(addDays(today, 7));

    const [
      candidates,
      jobs,
      processes,
      interviews,
      proposals,
      admissions,
      employees,
      hrDocuments,
      candidateDocuments,
      talentPool,
      onboardingTasks,
      timeOffRequests,
      terminations,
      allActiveProcesses,
      allPendingDocuments,
      allOpenJobs,
      allActiveEmployees,
      nextInterviews,
    ] = await Promise.all([
      Candidate.findAll({ where: rangeFilter('createdAt', range), raw: true }),
      JobOpening.findAll({ where: rangeFilter('createdAt', range), raw: true }),
      RecruitmentProcess.findAll({
        where: {
          [Op.or]: [rangeFilter('startedAt', range), rangeFilter('createdAt', range)],
        },
        raw: true,
      }),
      Interview.findAll({ where: rangeFilter('scheduledAt', range), raw: true }),
      HrProposal.findAll({ where: rangeFilter('createdAt', range), raw: true }),
      Admission.findAll({
        where: {
          [Op.or]: [rangeFilter('startDate', range), rangeFilter('createdAt', range)],
        },
        raw: true,
      }),
      Employee.findAll({
        where: {
          [Op.or]: [rangeFilter('admissionDate', range), rangeFilter('createdAt', range)],
        },
        raw: true,
      }),
      HrDocument.findAll({ where: rangeFilter('createdAt', range), raw: true }),
      CandidateDocument.findAll({ where: rangeFilter('createdAt', range), raw: true }),
      TalentPool.findAll({ where: rangeFilter('createdAt', range), raw: true }),
      OnboardingTask.findAll({ where: rangeFilter('createdAt', range), raw: true }),
      TimeOffRequest.findAll({ where: rangeFilter('startDate', range), raw: true }),
      Termination.findAll({
        where: {
          [Op.or]: [rangeFilter('requestedAt', range), rangeFilter('createdAt', range)],
        },
        raw: true,
      }),
      RecruitmentProcess.count({ where: { status: { [Op.in]: ['em_andamento', 'pausado'] } } }),
      HrDocument.count({ where: { status: { [Op.in]: ['pendente', 'enviado', 'recusado', 'vencido'] } } }),
      JobOpening.count({ where: { status: { [Op.in]: ['aberta', 'triagem', 'entrevistas', 'proposta', 'admissao'] } } }),
      Employee.count({ where: { status: { [Op.in]: ['ativo', 'experiencia', 'ferias', 'afastado'] } } }),
      Interview.findAll({
        where: {
          scheduledAt: { [Op.gte]: today, [Op.lte]: inSevenDays },
          status: { [Op.in]: ['agendada', 'confirmada', 'remarcada'] },
        },
        order: [['scheduledAt', 'ASC']],
        limit: 6,
        raw: true,
      }),
    ]);

    const dateSeries = buildDateSeries(range.start, range.end);
    const seriesMap = new Map(dateSeries.map((item) => [item.date, item]));

    candidates.forEach((item) => incrementSeries(seriesMap, item.createdAt, 'candidates'));
    jobs.forEach((item) => incrementSeries(seriesMap, item.createdAt, 'processes'));
    processes.forEach((item) => incrementSeries(seriesMap, item.startedAt || item.createdAt, 'processes'));
    interviews.forEach((item) => incrementSeries(seriesMap, item.scheduledAt, 'interviews'));
    proposals.forEach((item) => incrementSeries(seriesMap, item.createdAt, 'proposals'));
    admissions.forEach((item) => incrementSeries(seriesMap, item.createdAt || item.startDate, 'admissions'));
    employees.forEach((item) => incrementSeries(seriesMap, item.admissionDate || item.createdAt, 'employees'));
    hrDocuments.forEach((item) => incrementSeries(seriesMap, item.createdAt, 'documents'));
    candidateDocuments.forEach((item) => incrementSeries(seriesMap, item.createdAt, 'documents'));

    const totalDocuments = hrDocuments.length + candidateDocuments.length;
    const validatedDocuments = hrDocuments.filter((item) => item.status === 'validado').length + candidateDocuments.length;
    const acceptedProposals = proposals.filter((item) => item.status === 'aceita').length;
    const completedAdmissions = admissions.filter((item) => item.status === 'concluida').length;
    const hiredCandidates = candidates.filter((item) => item.status === 'contratado' || item.status === 'aprovado').length;
    const highPotentialCandidates = candidates.filter((item) => Number(item.rating || 0) >= 8).length;
    const delayedProcesses = processes.filter((item) => {
      if (!item.nextActionAt) return false;
      return new Date(item.nextActionAt) < now && ['em_andamento', 'pausado'].includes(item.status);
    }).length;
    const overdueDocuments = hrDocuments.filter((item) => {
      if (!item.dueDate) return false;
      return new Date(item.dueDate) < today && ['pendente', 'enviado', 'recusado', 'vencido'].includes(item.status);
    }).length;

    const funnel = [
      { label: 'Candidatos', value: candidates.length },
      { label: 'Processos', value: processes.length },
      { label: 'Entrevistas', value: interviews.length },
      { label: 'Propostas', value: proposals.length },
      { label: 'Admissões', value: admissions.length },
      { label: 'Contratações', value: Math.max(employees.length, completedAdmissions) },
    ];

    const indicators = {
      candidates: candidates.length,
      openJobs: allOpenJobs,
      activeProcesses: allActiveProcesses,
      scheduledInterviews: interviews.filter((item) => ['agendada', 'confirmada', 'remarcada'].includes(item.status)).length,
      acceptedProposals,
      admissions: admissions.length,
      activeEmployees: allActiveEmployees,
      pendingDocuments: allPendingDocuments,
      highPotentialCandidates,
      delayedProcesses,
      overdueDocuments,
      conversionToInterview: percentage(interviews.length, candidates.length),
      conversionToProposal: percentage(proposals.length, candidates.length),
      conversionToAdmission: percentage(admissions.length, candidates.length),
      offerAcceptanceRate: percentage(acceptedProposals, proposals.length),
      documentComplianceRate: percentage(validatedDocuments, totalDocuments),
      avgCandidateRating: average(candidates, 'rating'),
      avgProcessScore: average(processes, 'score'),
      avgInterviewScore: (() => {
        const values = interviews
          .map((item) => {
            const scores = [item.communicationScore, item.technicalScore, item.cultureScore]
              .map(Number)
              .filter((value) => Number.isFinite(value) && value > 0);
            if (!scores.length) return 0;
            return scores.reduce((sum, value) => sum + value, 0) / scores.length;
          })
          .filter((value) => value > 0);
        if (!values.length) return 0;
        return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
      })(),
    };

    return res.json({
      success: true,
      data: {
        updatedAt: new Date().toISOString(),
        range: {
          startDate: range.startDate,
          endDate: range.endDate,
          period: range.period,
        },
        indicators,
        series: dateSeries,
        funnel,
        distributions: {
          candidateStatus: countBy(candidates, 'status'),
          candidateSource: countBy(candidates, 'source'),
          processStage: countBy(processes, 'stage'),
          interviewStatus: countBy(interviews, 'status'),
          proposalStatus: countBy(proposals, 'status'),
          admissionStatus: countBy(admissions, 'status'),
          documentStatus: countBy(hrDocuments, 'status'),
          jobDepartment: countBy(jobs, 'department'),
          jobStatus: countBy(jobs, 'status'),
          talentLevel: countBy(talentPool, 'level'),
          timeOffType: countBy(timeOffRequests, 'type'),
          terminationType: countBy(terminations, 'type'),
          onboardingCategory: countBy(onboardingTasks, 'category'),
          desiredPositions: countByGetter(candidates, (item) => item.desiredPosition, 10),
        },
        alerts: {
          delayedProcesses,
          overdueDocuments,
          pendingDocuments: allPendingDocuments,
          pendingAdmissions: admissions.filter((item) => !['concluida', 'cancelada'].includes(item.status)).length,
          pendingOnboarding: onboardingTasks.filter((item) => ['pendente', 'em_andamento', 'atrasada'].includes(item.status)).length,
          upcomingTimeOff: timeOffRequests.filter((item) => ['solicitado', 'em_analise', 'aprovado'].includes(item.status)).length,
          terminationsInProgress: terminations.filter((item) => !['concluido', 'cancelado'].includes(item.status)).length,
        },
        nextInterviews,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao carregar BI gerencial de pessoas.',
      error: error.message,
    });
  }
}

module.exports = { getManagerialBI };
