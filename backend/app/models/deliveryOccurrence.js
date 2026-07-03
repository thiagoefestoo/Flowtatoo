const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const Delivery = require('./delivery');
const User = require('./user');

const DeliveryOccurrence = sequelize.define(
  'DeliveryOccurrence',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deliveryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'delivery_id',
      references: { model: Delivery, key: 'id' },
    },
    type: {
      type: DataTypes.ENUM('cliente_ausente', 'endereco_incorreto', 'recusa_recebimento', 'produto_avariado', 'atraso_rota', 'problema_operacional', 'outro'),
      allowNull: false,
      defaultValue: 'outro',
    },
    severity: {
      type: DataTypes.ENUM('baixa', 'media', 'alta', 'critica'),
      allowNull: false,
      defaultValue: 'media',
    },
    status: {
      type: DataTypes.ENUM('aberta', 'em_analise', 'resolvida', 'cancelada'),
      allowNull: false,
      defaultValue: 'aberta',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    solution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    registeredById: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'registered_by_id',
      references: { model: User, key: 'id' },
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
    },
  },
  {
    tableName: 'delivery_occurrences',
    timestamps: true,
  }
);

DeliveryOccurrence.belongsTo(Delivery, { as: 'delivery', foreignKey: 'deliveryId', constraints: false });
DeliveryOccurrence.belongsTo(User, { as: 'registeredBy', foreignKey: 'registeredById', constraints: false });

module.exports = DeliveryOccurrence;
