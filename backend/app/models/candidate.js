const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Candidate = sequelize.define('Candidate', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(180), allowNull: false },
  email: { type: DataTypes.STRING(180), allowNull: true },
  phone: { type: DataTypes.STRING(40), allowNull: true },
  city: { type: DataTypes.STRING(120), allowNull: true },
  state: { type: DataTypes.STRING(2), allowNull: true },
  desiredPosition: { type: DataTypes.STRING(180), allowNull: true, field: 'desired_position' },
  source: { type: DataTypes.ENUM('indicacao','linkedin','site','whatsapp','banco_talentos','agencia','outro'), allowNull: false, defaultValue: 'site' },
  salaryExpectation: { type: DataTypes.DECIMAL(12, 2), allowNull: true, field: 'salary_expectation' },
  linkedinUrl: { type: DataTypes.STRING(255), allowNull: true, field: 'linkedin_url' },
  resumeUrl: { type: DataTypes.STRING(255), allowNull: true, field: 'resume_url' },
  status: { type: DataTypes.ENUM('novo','em_triagem','em_processo','aprovado','reprovado','banco_talentos','contratado'), allowNull: false, defaultValue: 'novo' },
  stage: { type: DataTypes.ENUM('inscrito','triagem_curricular','contato_inicial','entrevista_rh','entrevista_tecnica','teste_pratico','entrevista_gestor','proposta','admissao','finalizado'), allowNull: false, defaultValue: 'inscrito' },
  rating: { type: DataTypes.INTEGER, allowNull: true },
  tags: { type: DataTypes.STRING(255), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'flowtatoo_candidates', timestamps: true });

module.exports = Candidate;
