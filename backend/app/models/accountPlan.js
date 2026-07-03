const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');

const AccountPlan = sequelize.define(
  'AccountPlan',
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
      type: DataTypes.ENUM('receita', 'despesa', 'custo', 'ativo', 'passivo', 'patrimonio'),
      allowNull: false,
    },
    nature: {
      type: DataTypes.ENUM('entrada', 'saida', 'neutro'),
      allowNull: false,
      defaultValue: 'neutro',
    },
    status: {
      type: DataTypes.ENUM('ativo', 'inativo'),
      allowNull: false,
      defaultValue: 'ativo',
    },
    parentCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'account_plans',
  }
);

module.exports = AccountPlan;