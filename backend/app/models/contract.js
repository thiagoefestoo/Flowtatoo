const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');

const Contract = sequelize.define(
  'Contract',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('cliente', 'fornecedor', 'interno'),
      allowNull: false,
      defaultValue: 'cliente',
    },
    status: {
      type: DataTypes.ENUM('rascunho', 'ativo', 'suspenso', 'encerrado', 'cancelado'),
      allowNull: false,
      defaultValue: 'rascunho',
    },
    approvalStatus: {
      type: DataTypes.ENUM('nao_enviado', 'pendente', 'aprovado', 'reprovado'),
      allowNull: false,
      defaultValue: 'nao_enviado',
      field: 'approval_status',
    },
    requestedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'requested_by',
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'approved_by',
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    rejectedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'rejected_by',
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'rejected_at',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    monthlyValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paymentDay: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    renewalType: {
      type: DataTypes.ENUM('nao_renova', 'mensal', 'anual', 'manual'),
      allowNull: false,
      defaultValue: 'manual',
    },
    object: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'contracts',
  }
);

module.exports = Contract;