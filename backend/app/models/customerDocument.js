const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const Customer = require('./customer');
const User = require('./user');

const CustomerDocument = sequelize.define(
  'CustomerDocument',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customer_id',
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
    tableName: 'customer_documents',
  }
);

CustomerDocument.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});

CustomerDocument.belongsTo(User, {
  foreignKey: 'uploadedBy',
  as: 'uploadedByUser',
  constraints: false,
});

module.exports = CustomerDocument;