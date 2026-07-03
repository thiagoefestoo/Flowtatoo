const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Candidate = require('./candidate');

const Admission = sequelize.define('Admission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  candidateId: { type: DataTypes.UUID, allowNull: true, field: 'candidate_id', references: { model: Candidate, key: 'id' } },
  employeeName: { type: DataTypes.STRING(180), allowNull: false, field: 'employee_name' },
  jobTitle: { type: DataTypes.STRING(180), allowNull: false, field: 'job_title' },
  department: { type: DataTypes.STRING(120), allowNull: true },
  managerName: { type: DataTypes.STRING(140), allowNull: true, field: 'manager_name' },
  startDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'start_date' },
  status: { type: DataTypes.ENUM('documentos_pendentes','exame_pendente','contrato_pendente','acessos_pendentes','integracao_agendada','concluida','cancelada'), allowNull: false, defaultValue: 'documentos_pendentes' },
  documentsStatus: { type: DataTypes.ENUM('pendente','enviado','validado','recusado'), allowNull: false, defaultValue: 'pendente', field: 'documents_status' },
  medicalExamStatus: { type: DataTypes.ENUM('pendente','agendado','realizado','apto','inapto'), allowNull: false, defaultValue: 'pendente', field: 'medical_exam_status' },
  contractStatus: { type: DataTypes.ENUM('pendente','enviado','assinado'), allowNull: false, defaultValue: 'pendente', field: 'contract_status' },
  accessStatus: { type: DataTypes.ENUM('pendente','solicitado','liberado'), allowNull: false, defaultValue: 'pendente', field: 'access_status' },
  equipmentStatus: { type: DataTypes.ENUM('pendente','separado','entregue','nao_aplica'), allowNull: false, defaultValue: 'pendente', field: 'equipment_status' },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'flowtatoo_admissions', timestamps: true });

Admission.belongsTo(Candidate, {
  foreignKey: 'candidateId',
  as: 'candidate',
  constraints: false,
});

module.exports = Admission;
