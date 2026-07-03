const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Candidate = require('./candidate');

const TalentPool = sequelize.define('TalentPool', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  candidateId: { type: DataTypes.UUID, allowNull: true, field: 'candidate_id', references: { model: Candidate, key: 'id' } },
  candidateName: { type: DataTypes.STRING(180), allowNull: false, field: 'candidate_name' },
  email: { type: DataTypes.STRING(180), allowNull: true },
  phone: { type: DataTypes.STRING(40), allowNull: true },
  area: { type: DataTypes.STRING(140), allowNull: false },
  level: { type: DataTypes.ENUM('estagio','junior','pleno','senior','lideranca','especialista'), allowNull: false, defaultValue: 'pleno' },
  availability: { type: DataTypes.ENUM('imediata','ate_15_dias','ate_30_dias','empregado','indisponivel'), allowNull: false, defaultValue: 'imediata' },
  rating: { type: DataTypes.INTEGER, allowNull: true },
  lastContactAt: { type: DataTypes.DATEONLY, allowNull: true, field: 'last_contact_at' },
  status: { type: DataTypes.ENUM('ativo','em_contato','reservado','inativo'), allowNull: false, defaultValue: 'ativo' },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'flowtatoo_talent_pool', timestamps: true });

TalentPool.belongsTo(Candidate, {
  foreignKey: 'candidateId',
  as: 'candidate',
  constraints: false,
});

module.exports = TalentPool;
