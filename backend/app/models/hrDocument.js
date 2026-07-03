const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Candidate = require('./candidate');

const HrDocument = sequelize.define('HrDocument', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  candidateId: { type: DataTypes.UUID, allowNull: true, field: 'candidate_id', references: { model: Candidate, key: 'id' } },
  personName: { type: DataTypes.STRING(180), allowNull: false, field: 'person_name' },
  personType: { type: DataTypes.ENUM('candidato','colaborador','empresa','outro'), allowNull: false, defaultValue: 'colaborador', field: 'person_type' },
  documentType: { type: DataTypes.STRING(120), allowNull: false, field: 'document_type' },
  status: { type: DataTypes.ENUM('pendente','enviado','validado','recusado','vencido'), allowNull: false, defaultValue: 'pendente' },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'due_date' },
  fileUrl: { type: DataTypes.STRING(255), allowNull: true, field: 'file_url' },
  validatedBy: { type: DataTypes.STRING(140), allowNull: true, field: 'validated_by' },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'flowtatoo_hr_documents', timestamps: true });

HrDocument.belongsTo(Candidate, {
  foreignKey: 'candidateId',
  as: 'candidate',
  constraints: false,
});

module.exports = HrDocument;
