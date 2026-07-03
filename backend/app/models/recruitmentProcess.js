const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Candidate = require('./candidate');

const RecruitmentProcess = sequelize.define('RecruitmentProcess', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  candidateId: { type: DataTypes.UUID, allowNull: true, field: 'candidate_id', references: { model: Candidate, key: 'id' } },
  candidateName: { type: DataTypes.STRING(180), allowNull: false, field: 'candidate_name' },
  jobTitle: { type: DataTypes.STRING(180), allowNull: false, field: 'job_title' },
  recruiterName: { type: DataTypes.STRING(140), allowNull: true, field: 'recruiter_name' },
  stage: { type: DataTypes.ENUM('triagem_curricular','contato_inicial','entrevista_rh','entrevista_tecnica','teste_pratico','entrevista_gestor','proposta','admissao','finalizado'), allowNull: false, defaultValue: 'triagem_curricular' },
  status: { type: DataTypes.ENUM('em_andamento','pausado','aprovado','reprovado','desistente','contratado'), allowNull: false, defaultValue: 'em_andamento' },
  score: { type: DataTypes.INTEGER, allowNull: true },
  startedAt: { type: DataTypes.DATEONLY, allowNull: true, field: 'started_at' },
  nextActionAt: { type: DataTypes.DATE, allowNull: true, field: 'next_action_at' },
  lastContactAt: { type: DataTypes.DATE, allowNull: true, field: 'last_contact_at' },
  strengths: { type: DataTypes.TEXT, allowNull: true },
  risks: { type: DataTypes.TEXT, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'flowtatoo_recruitment_processes', timestamps: true });

RecruitmentProcess.belongsTo(Candidate, {
  foreignKey: 'candidateId',
  as: 'candidate',
  constraints: false,
});

module.exports = RecruitmentProcess;
