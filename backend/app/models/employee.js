const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(180), allowNull: false },
  email: { type: DataTypes.STRING(180), allowNull: true },
  phone: { type: DataTypes.STRING(40), allowNull: true },
  document: { type: DataTypes.STRING(40), allowNull: true },
  jobTitle: { type: DataTypes.STRING(180), allowNull: false, field: 'job_title' },
  department: { type: DataTypes.STRING(120), allowNull: true },
  managerName: { type: DataTypes.STRING(140), allowNull: true, field: 'manager_name' },
  admissionDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'admission_date' },
  contractType: { type: DataTypes.ENUM('clt','pj','temporario','estagio','aprendiz','terceiro'), allowNull: false, defaultValue: 'clt', field: 'contract_type' },
  salary: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  benefits: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('ativo','experiencia','afastado','ferias','desligado','inativo'), allowNull: false, defaultValue: 'ativo' },
  experienceReview30: { type: DataTypes.DATEONLY, allowNull: true, field: 'experience_review_30' },
  experienceReview60: { type: DataTypes.DATEONLY, allowNull: true, field: 'experience_review_60' },
  experienceReview90: { type: DataTypes.DATEONLY, allowNull: true, field: 'experience_review_90' },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'flowtatoo_employees', timestamps: true });

module.exports = Employee;
