const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const Activity = require('./activity');
const User = require('./user');

const ActivityDocument = sequelize.define(
  'ActivityDocument',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    activityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'activity_id',
      references: { model: Activity, key: 'id' },
    },
    documentType: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'documento',
      field: 'document_type',
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'original_name',
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_name',
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_path',
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'mime_type',
    },
    sizeBytes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'size_bytes',
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'uploaded_by',
      references: { model: User, key: 'id' },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'crm_activity_documents',
    timestamps: true,
  }
);

ActivityDocument.belongsTo(Activity, {
  foreignKey: 'activityId',
  as: 'activity',
});

ActivityDocument.belongsTo(User, {
  foreignKey: 'uploadedBy',
  as: 'uploadedByUser',
  constraints: false,
});

Activity.hasMany(ActivityDocument, {
  foreignKey: 'activityId',
  as: 'documents',
});

module.exports = ActivityDocument;
