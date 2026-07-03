const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const User = require('./user');
const Customer = require('./customer');
const Company = require('./company');

const Delivery = sequelize.define(
  'Delivery',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING(60),
      allowNull: true,
      field: 'order_number',
    },
    title: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    document: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customer_id',
      references: { model: Customer, key: 'id' },
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'company_id',
      references: { model: Company, key: 'id' },
    },
    driverId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'driver_id',
      references: { model: User, key: 'id' },
    },
    recipientName: {
      type: DataTypes.STRING(180),
      allowNull: true,
      field: 'recipient_name',
    },
    recipientPhone: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: 'recipient_phone',
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'zip_code',
    },
    address: {
      type: DataTypes.STRING(180),
      allowNull: false,
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
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(2),
      allowNull: false,
    },
    referencePoint: {
      type: DataTypes.STRING(180),
      allowNull: true,
      field: 'reference_point',
    },
    priority: {
      type: DataTypes.ENUM('baixa', 'media', 'alta', 'urgente'),
      allowNull: false,
      defaultValue: 'media',
    },
    status: {
      type: DataTypes.ENUM('pendente', 'enviada', 'recebida', 'em_rota', 'entregue', 'nao_entregue', 'cancelada'),
      allowNull: false,
      defaultValue: 'pendente',
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'scheduled_date',
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'delivered_at',
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'delivery_fee',
    },
    proofCode: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: 'proof_code',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    driverNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'driver_notes',
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
    tableName: 'flow_deliveries',
    timestamps: true,
  }
);

Delivery.belongsTo(Customer, { as: 'customer', foreignKey: 'customerId', constraints: false });
Delivery.belongsTo(Company, { as: 'company', foreignKey: 'companyId', constraints: false });
Delivery.belongsTo(User, { as: 'driver', foreignKey: 'driverId', constraints: false });
Delivery.belongsTo(User, { as: 'approver', foreignKey: 'approvedById', constraints: false });

module.exports = Delivery;
