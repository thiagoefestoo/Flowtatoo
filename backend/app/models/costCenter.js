const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');

const CostCenter = sequelize.define(
  'CostCenter',
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
    type: {
      type: DataTypes.ENUM('administrativo', 'comercial', 'operacional', 'financeiro', 'projeto', 'outro'),
      allowNull: false,
      defaultValue: 'operacional',
    },
    status: {
      type: DataTypes.ENUM('ativo', 'inativo'),
      allowNull: false,
      defaultValue: 'ativo',
    },
    responsibleName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    budgetLimit: {
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
    tableName: 'cost_centers',
  }
);

module.exports = CostCenter;