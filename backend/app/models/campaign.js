const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const User = require('./user');

const Campaign = sequelize.define(
  'Campaign',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    document: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    channel: {
      type: DataTypes.ENUM('instagram', 'facebook', 'google', 'linkedin', 'whatsapp', 'email', 'indicacao', 'outro'),
      allowNull: false,
      defaultValue: 'instagram',
    },
    status: {
      type: DataTypes.ENUM('planejada', 'ativa', 'pausada', 'finalizada', 'cancelada'),
      allowNull: false,
      defaultValue: 'planejada',
    },
    budget: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    leadsGenerated: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'leads_generated',
    },
    opportunitiesGenerated: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'opportunities_generated',
    },
    expectedRevenue: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'expected_revenue',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date',
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'crm_campaigns',
    timestamps: true,
  }
);

Campaign.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
Campaign.belongsTo(User, { as: 'approver', foreignKey: 'approvedById', constraints: false });

module.exports = Campaign;
