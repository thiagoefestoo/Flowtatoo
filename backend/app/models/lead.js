const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const User = require('./user');

const Lead = sequelize.define(
  'Lead',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    company: {
      type: DataTypes.STRING(160),
      allowNull: true,
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
    segment: {
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
    source: {
      type: DataTypes.ENUM('site', 'whatsapp', 'indicacao', 'instagram', 'linkedin', 'telefone', 'evento', 'outro'),
      allowNull: false,
      defaultValue: 'site',
    },
    status: {
      type: DataTypes.ENUM('novo', 'em_contato', 'qualificado', 'desqualificado', 'convertido'),
      allowNull: false,
      defaultValue: 'novo',
    },
    temperature: {
      type: DataTypes.ENUM('frio', 'morno', 'quente'),
      allowNull: false,
      defaultValue: 'morno',
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    estimatedValue: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'estimated_value',
    },
    interest: {
      type: DataTypes.STRING(220),
      allowNull: true,
    },
    nextContactAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_contact_at',
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'owner_id',
      references: {
        model: User,
        key: 'id',
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'crm_leads',
    timestamps: true,
  }
);

Lead.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });

module.exports = Lead;
