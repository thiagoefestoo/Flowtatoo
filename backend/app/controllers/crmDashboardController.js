const { Op, QueryTypes } = require('sequelize');

const sequelize = require('../../config/db');
const Customer = require('../models/customer');
const Lead = require('../models/lead');
const Opportunity = require('../models/opportunity');
const Activity = require('../models/activity');
const Interaction = require('../models/interaction');
const Proposal = require('../models/proposal');
const Campaign = require('../models/campaign');

function money(value) {
  return Number(value || 0);
}

function number(value) {
  return Number(value || 0);
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function getApprovedWonOpportunityMetrics() {
  const [row] = await sequelize.query(
    `
      SELECT
        COUNT(DISTINCT opportunity.id)::int AS total,
        COALESCE(SUM(opportunity.value), 0)::numeric AS value
      FROM crm_opportunities opportunity
      WHERE opportunity.status = 'ganha'
        AND opportunity.approval_status = 'aprovado'
        AND EXISTS (
          SELECT 1
          FROM crm_activities activity
          WHERE activity.approval_status = 'aprovado'
            AND (
              activity.opportunity_id = opportunity.id
              OR (
                opportunity.customer_id IS NOT NULL
                AND activity.customer_id = opportunity.customer_id
              )
              OR (
                opportunity.lead_id IS NOT NULL
                AND activity.lead_id = opportunity.lead_id
              )
            )
        );
    `,
    { type: QueryTypes.SELECT }
  );

  return {
    total: number(row?.total),
    value: money(row?.value),
  };
}

async function getApprovedProposalMetrics() {
  const [row] = await sequelize.query(
    `
      SELECT
        COUNT(DISTINCT proposal.id)::int AS total,
        COALESCE(SUM(proposal.value), 0)::numeric AS value
      FROM crm_proposals proposal
      WHERE proposal.status = 'aprovada'
        AND proposal.approval_status = 'aprovado'
        AND EXISTS (
          SELECT 1
          FROM crm_activities activity
          WHERE activity.approval_status = 'aprovado'
            AND (
              (
                proposal.opportunity_id IS NOT NULL
                AND activity.opportunity_id = proposal.opportunity_id
              )
              OR (
                proposal.customer_id IS NOT NULL
                AND activity.customer_id = proposal.customer_id
              )
            )
        );
    `,
    { type: QueryTypes.SELECT }
  );

  return {
    total: number(row?.total),
    value: money(row?.value),
  };
}

async function getSummary(req, res) {
  try {
    const today = startOfToday();
    const nextSevenDays = new Date(today);
    nextSevenDays.setDate(nextSevenDays.getDate() + 7);

    const [
      customers,
      leads,
      qualifiedLeads,
      hotLeads,
      opportunities,
      openOpportunities,
      lostOpportunities,
      pipelineValue,
      approvedWonMetrics,
      proposals,
      sentProposals,
      approvedProposalMetrics,
      pendingActivities,
      overdueActivities,
      pendingApprovalActivities,
      approvedActivities,
      interactions,
      campaigns,
      recentLeads,
      recentOpportunities,
      recentActivities,
      recentInteractions,
    ] = await Promise.all([
      Customer.count(),
      Lead.count(),
      Lead.count({ where: { status: 'qualificado' } }),
      Lead.count({ where: { temperature: 'quente' } }),
      Opportunity.count(),
      Opportunity.count({ where: { status: 'aberta' } }),
      Opportunity.count({ where: { status: 'perdida' } }),
      Opportunity.sum('value', { where: { status: 'aberta' } }),
      getApprovedWonOpportunityMetrics(),
      Proposal.count(),
      Proposal.count({ where: { status: { [Op.in]: ['enviada', 'em_negociacao'] } } }),
      getApprovedProposalMetrics(),
      Activity.count({ where: { status: { [Op.in]: ['pendente', 'em_andamento'] } } }),
      Activity.count({
        where: {
          status: { [Op.in]: ['pendente', 'em_andamento'] },
          dueDate: { [Op.lt]: today },
        },
      }),
      Activity.count({ where: { approvalStatus: 'pendente' } }),
      Activity.count({ where: { approvalStatus: 'aprovado' } }),
      Interaction.count(),
      Campaign.count(),
      Lead.findAll({ limit: 5, order: [['createdAt', 'DESC']] }),
      Opportunity.findAll({ limit: 5, order: [['createdAt', 'DESC']] }),
      Activity.findAll({
        limit: 5,
        where: {
          status: { [Op.in]: ['pendente', 'em_andamento'] },
          dueDate: { [Op.lte]: nextSevenDays },
        },
        order: [['dueDate', 'ASC']],
      }),
      Interaction.findAll({ limit: 5, order: [['interactionDate', 'DESC']] }),
    ]);

    const wonOpportunities = approvedWonMetrics.total;
    const wonValue = approvedWonMetrics.value;
    const approvedProposals = approvedProposalMetrics.total;
    const approvedProposalsValue = approvedProposalMetrics.value;
    const conversionRate = leads > 0 ? (wonOpportunities / leads) * 100 : 0;

    return res.json({
      success: true,
      data: {
        totals: {
          customers,
          leads,
          opportunities,
          proposals,
          interactions,
          campaigns,
        },
        leads: {
          qualifiedLeads,
          hotLeads,
        },
        commercial: {
          openOpportunities,
          wonOpportunities,
          lostOpportunities,
          pipelineValue: money(pipelineValue),
          wonValue: money(wonValue),
          conversionRate,
          conversionRule: 'Ganhos e conversão consideram somente oportunidades ganhas, aprovadas e com atividade aprovada.',
        },
        proposals: {
          sentProposals,
          approvedProposals,
          approvedProposalsValue: money(approvedProposalsValue),
          approvalRule: 'Propostas aprovadas entram no BI somente após aprovação da proposta e atividade vinculada aprovada.',
        },
        activities: {
          pendingActivities,
          overdueActivities,
          pendingApprovalActivities,
          approvedActivities,
        },
        recent: {
          leads: recentLeads,
          opportunities: recentOpportunities,
          activities: recentActivities,
          interactions: recentInteractions,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar resumo do CRM.',
      error: error.message,
    });
  }
}

module.exports = {
  getSummary,
};
