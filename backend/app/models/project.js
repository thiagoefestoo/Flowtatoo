const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');

const Project = sequelize.define(
  'Project',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado'),
      allowNull: false,
      defaultValue: 'planejamento',
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
    priority: {
      type: DataTypes.ENUM('baixa', 'media', 'alta', 'critica'),
      allowNull: false,
      defaultValue: 'media',
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    contractId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    managerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    budget: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    spentValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'projects',
  }
);

module.exports = Project;