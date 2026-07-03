const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    role: {
      type: DataTypes.ENUM('admin', 'rh', 'gestor', 'operador', 'entrevistador', 'colaborador', 'financeiro', 'vendedor', 'viewer', 'entregador'),
      allowNull: false,
      defaultValue: 'viewer',
    },
    status: {
      type: DataTypes.ENUM('ativo', 'inativo', 'bloqueado'),
      allowNull: false,
      defaultValue: 'ativo',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
  }
);

module.exports = User;