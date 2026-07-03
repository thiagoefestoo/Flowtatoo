const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const Supplier = require('./supplier');
const User = require('./user');

const Purchase = sequelize.define(
  'Purchase',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'supplier_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
    },
    number: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'issue_date',
    },
    status: {
      type: DataTypes.ENUM('rascunho', 'confirmada', 'cancelada'),
      allowNull: false,
      defaultValue: 'confirmada',
    },
    paymentStatus: {
      type: DataTypes.ENUM('pendente', 'parcial', 'pago'),
      allowNull: false,
      defaultValue: 'pendente',
      field: 'payment_status',
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

    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    freight: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'purchases',
    timestamps: true,
  }
);

Purchase.belongsTo(Supplier, {
  foreignKey: 'supplierId',
  as: 'supplier',
});

Purchase.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

module.exports = Purchase;