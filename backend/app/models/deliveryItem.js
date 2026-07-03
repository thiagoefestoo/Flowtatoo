const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const Delivery = require('./delivery');
const Product = require('./product');
const StockMovement = require('./stockMovement');

const DeliveryItem = sequelize.define(
  'DeliveryItem',
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
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 1,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'UN',
    },
    unitCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'unit_cost',
    },
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'unit_price',
    },
    totalCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_cost',
    },
    totalPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_price',
    },
    status: {
      type: DataTypes.ENUM('pendente', 'separado', 'baixado', 'devolvido'),
      allowNull: false,
      defaultValue: 'pendente',
    },
    stockStatus: {
      type: DataTypes.ENUM('pendente', 'baixado', 'devolvido'),
      allowNull: false,
      defaultValue: 'pendente',
      field: 'stock_status',
    },
    stockMovementId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'stock_movement_id',
    },
    returnMovementId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'return_movement_id',
    },
    separatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'separated_at',
    },
    stockDeductedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'stock_deducted_at',
    },
    stockReturnedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'stock_returned_at',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'flow_delivery_items',
    timestamps: true,
  }
);

Delivery.hasMany(DeliveryItem, { as: 'items', foreignKey: 'deliveryId', constraints: false });
DeliveryItem.belongsTo(Delivery, { as: 'delivery', foreignKey: 'deliveryId', constraints: false });

Product.hasMany(DeliveryItem, { as: 'deliveryItems', foreignKey: 'productId', constraints: false });
DeliveryItem.belongsTo(Product, { as: 'product', foreignKey: 'productId', constraints: false });

DeliveryItem.belongsTo(StockMovement, { as: 'stockMovement', foreignKey: 'stockMovementId', constraints: false });
DeliveryItem.belongsTo(StockMovement, { as: 'returnMovement', foreignKey: 'returnMovementId', constraints: false });

module.exports = DeliveryItem;
