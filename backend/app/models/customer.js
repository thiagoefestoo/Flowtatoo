const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const User = require('./user');

const Customer = sequelize.define(
  'Customer',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('pessoa_fisica', 'pessoa_juridica'),
      allowNull: false,
      defaultValue: 'pessoa_juridica',
    },
    name: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    tradeName: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'trade_name',
    },
    document: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    stateRegistration: {
      type: DataTypes.STRING(60),
      allowNull: true,
      field: 'state_registration',
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    secondaryPhone: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: 'secondary_phone',
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'zip_code',
    },
    address: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },
    number: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    complement: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    district: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    segment: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('ativo', 'inativo', 'bloqueado'),
      allowNull: false,
      defaultValue: 'ativo',
    },
    approvalStatus: {
      type: DataTypes.ENUM('nao_enviado', 'pendente', 'aprovado', 'reprovado'),
      allowNull: false,
      defaultValue: 'nao_enviado',
      field: 'approval_status',
    },
    approvalRequestedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approval_requested_at',
    },
    approvalDecidedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approval_decided_at',
    },
    approvalNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'approval_note',
    },
    approvedById: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'approved_by_id',
      references: { model: User, key: 'id' },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'customers',
    timestamps: true,
  }
);

Customer.belongsTo(User, { as: 'approver', foreignKey: 'approvedById', constraints: false });

module.exports = Customer;