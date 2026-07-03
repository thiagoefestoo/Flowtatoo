const { DataTypes } = require('sequelize');

const Supplier = require('./supplier');
const sequelize = require('../../config/db');

const Product = sequelize.define(
'Product',
{
id: {
type: DataTypes.UUID,
defaultValue: DataTypes.UUIDV4,
primaryKey: true,
},
type: {
type: DataTypes.ENUM('produto', 'servico'),
allowNull: false,
defaultValue: 'produto',
},
name: {
type: DataTypes.STRING(180),
allowNull: false,
},
sku: {
type: DataTypes.STRING(80),
allowNull: true,
unique: true,
},
barcode: {
type: DataTypes.STRING(80),
allowNull: true,
},
supplierId: {
type: DataTypes.UUID,
allowNull: true,
field: 'supplier_id',
},
category: {
type: DataTypes.STRING(120),
allowNull: true,
},
unit: {
type: DataTypes.STRING(20),
allowNull: false,
defaultValue: 'UN',
},
costPrice: {
type: DataTypes.DECIMAL(12, 2),
allowNull: false,
defaultValue: 0,
field: 'cost_price',
},
salePrice: {
type: DataTypes.DECIMAL(12, 2),
allowNull: false,
defaultValue: 0,
field: 'sale_price',
},
minStock: {
type: DataTypes.DECIMAL(12, 3),
allowNull: false,
defaultValue: 0,
field: 'min_stock',
},
currentStock: {
type: DataTypes.DECIMAL(12, 3),
allowNull: false,
defaultValue: 0,
field: 'current_stock',
},
trackStock: {
type: DataTypes.BOOLEAN,
allowNull: false,
defaultValue: true,
field: 'track_stock',
},
status: {
type: DataTypes.ENUM('ativo', 'inativo'),
allowNull: false,
defaultValue: 'inativo',
},
approvalStatus: {
type: DataTypes.ENUM('nao_enviado', 'pendente', 'aprovado', 'reprovado'),
allowNull: false,
defaultValue: 'nao_enviado',
field: 'approval_status',
},
requestedBy: {
type: DataTypes.UUID,
allowNull: true,
field: 'requested_by',
},
approvedBy: {
type: DataTypes.UUID,
allowNull: true,
field: 'approved_by',
},
approvedAt: {
type: DataTypes.DATE,
allowNull: true,
field: 'approved_at',
},
rejectedBy: {
type: DataTypes.UUID,
allowNull: true,
field: 'rejected_by',
},
rejectedAt: {
type: DataTypes.DATE,
allowNull: true,
field: 'rejected_at',
},
rejectionReason: {
type: DataTypes.TEXT,
allowNull: true,
field: 'rejection_reason',
},
notes: {
type: DataTypes.TEXT,
allowNull: true,
},
},
{
tableName: 'products',
timestamps: true,
}
);

Product.belongsTo(Supplier, {
foreignKey: 'supplierId',
as: 'supplier',
});

module.exports = Product;
