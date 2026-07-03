const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Candidate = require('./candidate');

const Interview = sequelize.define('Interview', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  candidateId: { type: DataTypes.UUID, allowNull: true, field: 'candidate_id', references: { model: Candidate, key: 'id' } },
  candidateName: { type: DataTypes.STRING(180), allowNull: false, field: 'candidate_name' },
  jobTitle: { type: DataTypes.STRING(180), allowNull: false, field: 'job_title' },
  interviewerName: { type: DataTypes.STRING(140), allowNull: false, field: 'interviewer_name' },
  interviewType: { type: DataTypes.ENUM('presencial','online','telefone','rh','tecnica','gestor','dinamica'), allowNull: false, defaultValue: 'online', field: 'interview_type' },
  scheduledAt: { type: DataTypes.DATE, allowNull: false, field: 'scheduled_at' },
  locationOrLink: { type: DataTypes.STRING(255), allowNull: true, field: 'location_or_link' },
  status: { type: DataTypes.ENUM('agendada','confirmada','realizada','remarcada','cancelada','nao_compareceu'), allowNull: false, defaultValue: 'agendada' },
  communicationScore: { type: DataTypes.INTEGER, allowNull: true, field: 'communication_score' },
  technicalScore: { type: DataTypes.INTEGER, allowNull: true, field: 'technical_score' },
  cultureScore: { type: DataTypes.INTEGER, allowNull: true, field: 'culture_score' },
  result: { type: DataTypes.ENUM('aguardando','proxima_fase','aprovado','reprovado','banco_talentos'), allowNull: false, defaultValue: 'aguardando' },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'flowtatoo_interviews', timestamps: true });

Interview.belongsTo(Candidate, {
  foreignKey: 'candidateId',
  as: 'candidate',
  constraints: false,
});

module.exports = Interview;
