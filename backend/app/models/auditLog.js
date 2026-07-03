const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const User = require('./user');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    entityType: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: 'entity_type',
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'entity_id',
    },
    action: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: 'audit_logs',
  }
);

AuditLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

module.exports = AuditLog;