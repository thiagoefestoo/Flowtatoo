const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const Candidate = require('./candidate');
const User = require('./user');

const CandidateDocument = sequelize.define(
  'CandidateDocument',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    candidateId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'candidate_id',
      references: { model: Candidate, key: 'id' },
    },
    documentType: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'curriculo',
      field: 'document_type',
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'original_name',
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_name',
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_path',
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'mime_type',
    },
    sizeBytes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'size_bytes',
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'uploaded_by',
      references: { model: User, key: 'id' },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'flowtatoo_candidate_documents',
    timestamps: true,
  }
);

CandidateDocument.belongsTo(Candidate, {
  foreignKey: 'candidateId',
  as: 'candidate',
});

CandidateDocument.belongsTo(User, {
  foreignKey: 'uploadedBy',
  as: 'uploadedByUser',
  constraints: false,
});

Candidate.hasMany(CandidateDocument, {
  foreignKey: 'candidateId',
  as: 'documents',
});

module.exports = CandidateDocument;
