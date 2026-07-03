const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const Sale = require('./sale');
const Product = require('./product');

const SaleItem = sequelize.define(
  'SaleItem',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    saleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'sale_id',
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
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'unit_price',
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'sale_items',
    timestamps: true,
  }
);

Sale.hasMany(SaleItem, {
  foreignKey: 'saleId',
  as: 'items',
});

SaleItem.belongsTo(Sale, {
  foreignKey: 'saleId',
  as: 'sale',
});

SaleItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

module.exports = SaleItem;