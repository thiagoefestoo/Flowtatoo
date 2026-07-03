const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const JobOpening = sequelize.define('JobOpening', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING(60), allowNull: true },
  title: { type: DataTypes.STRING(180), allowNull: false },
  department: { type: DataTypes.STRING(120), allowNull: false },
  seniority: { type: DataTypes.ENUM('estagio','junior','pleno','senior','lideranca','especialista'), allowNull: false, defaultValue: 'pleno' },
  contractType: { type: DataTypes.ENUM('clt','pj','temporario','estagio','aprendiz','terceiro'), allowNull: false, defaultValue: 'clt', field: 'contract_type' },
  workModel: { type: DataTypes.ENUM('presencial','hibrido','remoto'), allowNull: false, defaultValue: 'presencial', field: 'work_model' },
  location: { type: DataTypes.STRING(160), allowNull: true },
  openings: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  salaryMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true, field: 'salary_min' },
  salaryMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true, field: 'salary_max' },
  benefits: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('rascunho','aberta','triagem','entrevistas','proposta','admissao','concluida','cancelada'), allowNull: false, defaultValue: 'aberta' },
  priority: { type: DataTypes.ENUM('baixa','media','alta','urgente'), allowNull: false, defaultValue: 'media' },
  recruiterName: { type: DataTypes.STRING(140), allowNull: true, field: 'recruiter_name' },
  managerName: { type: DataTypes.STRING(140), allowNull: true, field: 'manager_name' },
  deadline: { type: DataTypes.DATEONLY, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  requirements: { type: DataTypes.TEXT, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'flowtatoo_job_openings', timestamps: true });

module.exports = JobOpening;
