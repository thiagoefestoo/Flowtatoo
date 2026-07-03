const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');

const Supplier = sequelize.define(
  'Supplier',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('pessoa_fisica', 'pessoa_juridica'),
      allowNull: false,
      defaultValue: 'pessoa_juridica',
    },
    name: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    tradeName: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'trade_name',
    },
    document: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    stateRegistration: {
      type: DataTypes.STRING(60),
      allowNull: true,
      field: 'state_registration',
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    contactName: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'contact_name',
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'zip_code',
    },
    address: {
      type: DataTypes.STRING(180),
      allowNull: true,
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
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    paymentTerms: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'payment_terms',
    },
    status: {
      type: DataTypes.ENUM('ativo', 'inativo', 'bloqueado'),
      allowNull: false,
      defaultValue: 'ativo',
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
    tableName: 'suppliers',
    timestamps: true,
  }
);

module.exports = Supplier;