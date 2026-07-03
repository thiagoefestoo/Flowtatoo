const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const User = require('./user');
const Customer = require('./customer');
const Lead = require('./lead');
const Opportunity = require('./opportunity');

const Interaction = sequelize.define(
  'Interaction',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subject: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    channel: {
      type: DataTypes.ENUM('whatsapp', 'email', 'telefone', 'reuniao', 'visita', 'chat', 'outro'),
      allowNull: false,
      defaultValue: 'whatsapp',
    },
    direction: {
      type: DataTypes.ENUM('entrada', 'saida'),
      allowNull: false,
      defaultValue: 'saida',
    },
    interactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'interaction_date',
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
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nextStep: {
      type: DataTypes.STRING(240),
      allowNull: true,
      field: 'next_step',
    },
  },
  {
    tableName: 'crm_interactions',
    timestamps: true,
  }
);

Interaction.belongsTo(Customer, { as: 'customer', foreignKey: 'customerId' });
Interaction.belongsTo(Lead, { as: 'lead', foreignKey: 'leadId' });
Interaction.belongsTo(Opportunity, { as: 'opportunity', foreignKey: 'opportunityId' });
Interaction.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });

module.exports = Interaction;
