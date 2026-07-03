const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const Purchase = require('./purchase');
const Product = require('./product');

const PurchaseItem = sequelize.define(
  'PurchaseItem',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    purchaseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'purchase_id',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },
    unitCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'unit_cost',
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'purchase_items',
    timestamps: true,
  }
);

Purchase.hasMany(PurchaseItem, {
  foreignKey: 'purchaseId',
  as: 'items',
});

PurchaseItem.belongsTo(Purchase, {
  foreignKey: 'purchaseId',
  as: 'purchase',
});

PurchaseItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

module.exports = PurchaseItem;