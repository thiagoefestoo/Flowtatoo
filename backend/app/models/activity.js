const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const User = require('./user');
const Customer = require('./customer');
const Lead = require('./lead');
const Opportunity = require('./opportunity');

const Activity = sequelize.define(
  'Activity',
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
    type: {
      type: DataTypes.ENUM('ligacao', 'whatsapp', 'email', 'reuniao', 'visita', 'tarefa', 'follow_up'),
      allowNull: false,
      defaultValue: 'follow_up',
    },
    status: {
      type: DataTypes.ENUM('pendente', 'em_andamento', 'concluida', 'cancelada'),
      allowNull: false,
      defaultValue: 'pendente',
    },
    priority: {
      type: DataTypes.ENUM('baixa', 'media', 'alta', 'critica'),
      allowNull: false,
      defaultValue: 'media',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'customer_id',
      references: { model: Customer, key: 'id' },
    },
    leadId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'lead_id',
      references: { model: Lead, key: 'id' },
    },
    opportunityId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'opportunity_id',
      references: { model: Opportunity, key: 'id' },
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
    result: {
      type: DataTypes.TEXT,
      allowNull: true,
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
  },
  {
    tableName: 'crm_activities',
    timestamps: true,
  }
);

Activity.belongsTo(Customer, { as: 'customer', foreignKey: 'customerId' });
Activity.belongsTo(Lead, { as: 'lead', foreignKey: 'leadId' });
Activity.belongsTo(Opportunity, { as: 'opportunity', foreignKey: 'opportunityId' });
Activity.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
Activity.belongsTo(User, { as: 'approver', foreignKey: 'approvedById', constraints: false });

module.exports = Activity;
