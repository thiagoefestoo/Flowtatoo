const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const User = require('./user');
const Customer = require('./customer');
const Opportunity = require('./opportunity');

const Proposal = sequelize.define(
  'Proposal',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    number: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    document: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('rascunho', 'enviada', 'em_negociacao', 'aprovada', 'recusada', 'cancelada'),
      allowNull: false,
      defaultValue: 'rascunho',
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'customer_id',
      references: { model: Customer, key: 'id' },
    },
    opportunityId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'opportunity_id',
      references: { model: Opportunity, key: 'id' },
    },
    value: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    validUntil: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'valid_until',
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
    ownerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'owner_id',
      references: { model: User, key: 'id' },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paymentTerms: {
      type: DataTypes.STRING(220),
      allowNull: true,
      field: 'payment_terms',
    },
    scope: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'crm_proposals',
    timestamps: true,
  }
);

Proposal.belongsTo(Customer, { as: 'customer', foreignKey: 'customerId' });
Proposal.belongsTo(Opportunity, { as: 'opportunity', foreignKey: 'opportunityId' });
Proposal.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
Proposal.belongsTo(User, { as: 'approver', foreignKey: 'approvedById', constraints: false });

module.exports = Proposal;
