const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const FinancialEntry = require('./financialEntry');
const User = require('./user');

const FinancialPaymentProof = sequelize.define(
  'FinancialPaymentProof',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    financialEntryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'financial_entry_id',
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'payment_date',
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'payment_method',
    },
    paidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'paid_amount',
    },
    proofNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'proof_number',
    },
    bankAccount: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'bank_account',
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
    tableName: 'financial_payment_proofs',
  }
);

FinancialPaymentProof.belongsTo(FinancialEntry, {
  foreignKey: 'financialEntryId',
  as: 'financialEntry',
});

FinancialPaymentProof.belongsTo(User, {
  foreignKey: 'uploadedBy',
  as: 'uploadedByUser',
});

module.exports = FinancialPaymentProof;