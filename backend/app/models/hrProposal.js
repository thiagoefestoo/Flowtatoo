const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Candidate = require('./candidate');

const HrProposal = sequelize.define('HrProposal', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  candidateId: { type: DataTypes.UUID, allowNull: true, field: 'candidate_id', references: { model: Candidate, key: 'id' } },
  candidateName: { type: DataTypes.STRING(180), allowNull: false, field: 'candidate_name' },
  jobTitle: { type: DataTypes.STRING(180), allowNull: false, field: 'job_title' },
  salary: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  benefits: { type: DataTypes.TEXT, allowNull: true },
  startDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'start_date' },
  contractType: { type: DataTypes.ENUM('clt','pj','temporario','estagio','aprendiz','terceiro'), allowNull: false, defaultValue: 'clt', field: 'contract_type' },
  workModel: { type: DataTypes.ENUM('presencial','hibrido','remoto'), allowNull: false, defaultValue: 'presencial', field: 'work_model' },
  status: { type: DataTypes.ENUM('em_elaboracao','enviada','aceita','recusada','negociacao','cancelada'), allowNull: false, defaultValue: 'em_elaboracao' },
  sentAt: { type: DataTypes.DATEONLY, allowNull: true, field: 'sent_at' },
  acceptedAt: { type: DataTypes.DATEONLY, allowNull: true, field: 'accepted_at' },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'flowtatoo_hr_proposals', timestamps: true });

HrProposal.belongsTo(Candidate, {
  foreignKey: 'candidateId',
  as: 'candidate',
  constraints: false,
});

module.exports = HrProposal;
