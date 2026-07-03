const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const Supplier = require('./supplier');
const User = require('./user');

const SupplierDocument = sequelize.define(
  'SupplierDocument',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'supplier_id',
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
    tableName: 'supplier_documents',
  }
);

SupplierDocument.belongsTo(Supplier, {
  foreignKey: 'supplierId',
  as: 'supplier',
});

SupplierDocument.belongsTo(User, {
  foreignKey: 'uploadedBy',
  as: 'uploadedByUser',
});

module.exports = SupplierDocument;