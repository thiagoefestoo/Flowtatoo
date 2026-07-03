const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const User = require('./user');

const EntityDocument = sequelize.define(
  'EntityDocument',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    entityType: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: 'entity_type',
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'entity_id',
    },
    documentType: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'documento',
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
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'crm_entity_documents',
    timestamps: true,
  }
);

EntityDocument.belongsTo(User, {
  foreignKey: 'uploadedBy',
  as: 'uploadedByUser',
  constraints: false,
});

module.exports = EntityDocument;
