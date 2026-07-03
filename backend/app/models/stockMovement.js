const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const Product = require('./product');
const User = require('./user');

const StockMovement = sequelize.define(
  'StockMovement',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
    },
    type: {
      type: DataTypes.ENUM('entrada', 'saida', 'ajuste'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },
    stockBefore: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
      field: 'stock_before',
    },
    stockAfter: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
      field: 'stock_after',
    },
    unitCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'unit_cost',
    },
    totalCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_cost',
    },
    reason: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    reference: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'stock_movements',
    timestamps: true,
  }
);

StockMovement.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

StockMovement.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

module.exports = StockMovement;