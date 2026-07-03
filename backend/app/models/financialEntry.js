const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const Customer = require('./customer');
const Supplier = require('./supplier');
const User = require('./user');
const CostCenter = require('./costCenter');
const AccountPlan = require('./accountPlan');

const FinancialEntry = sequelize.define(
  'FinancialEntry',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('receber', 'pagar'),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'customer_id',
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'supplier_id',
    },
    costCenterId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'cost_center_id',
    },
    accountPlanId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'account_plan_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
    },
    reference: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'due_date',
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'payment_date',
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'paid_amount',
    },
    status: {
      type: DataTypes.ENUM('aberto', 'pago', 'vencido', 'cancelado'),
      allowNull: false,
      defaultValue: 'aberto',
    },
    paymentMethod: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: 'payment_method',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'financial_entries',
    timestamps: true,
  }
);

FinancialEntry.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});

FinancialEntry.belongsTo(Supplier, {
  foreignKey: 'supplierId',
  as: 'supplier',
});

FinancialEntry.belongsTo(CostCenter, {
  foreignKey: 'costCenterId',
  as: 'costCenter',
});

FinancialEntry.belongsTo(AccountPlan, {
  foreignKey: 'accountPlanId',
  as: 'accountPlan',
});

FinancialEntry.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

module.exports = FinancialEntry;