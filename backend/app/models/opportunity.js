const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const User = require('./user');
const Customer = require('./customer');
const Lead = require('./lead');

const Opportunity = sequelize.define(
  'Opportunity',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    document: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'customer_id',
      references: {
        model: Customer,
        key: 'id',
      },
    },
    leadId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'lead_id',
      references: {
        model: Lead,
        key: 'id',
      },
    },
    stage: {
      type: DataTypes.ENUM('prospeccao', 'qualificacao', 'diagnostico', 'proposta', 'negociacao', 'ganha', 'perdida'),
      allowNull: false,
      defaultValue: 'prospeccao',
    },
    status: {
      type: DataTypes.ENUM('aberta', 'ganha', 'perdida', 'pausada'),
      allowNull: false,
      defaultValue: 'aberta',
    },
    value: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    probability: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 0,
        max: 100,
      },
    },
    source: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    expectedCloseDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'expected_close_date',
    },
    lostReason: {
      type: DataTypes.STRING(240),
      allowNull: true,
      field: 'lost_reason',
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
      references: {
        model: User,
        key: 'id',
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'crm_opportunities',
    timestamps: true,
  }
);

Opportunity.belongsTo(Customer, { as: 'customer', foreignKey: 'customerId' });
Opportunity.belongsTo(Lead, { as: 'lead', foreignKey: 'leadId' });
Opportunity.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
Opportunity.belongsTo(User, { as: 'approver', foreignKey: 'approvedById', constraints: false });

module.exports = Opportunity;
