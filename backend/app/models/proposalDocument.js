const { DataTypes } = require('sequelize');

const sequelize = require('../../config/db');
const Proposal = require('./proposal');
const User = require('./user');

const ProposalDocument = sequelize.define(
  'ProposalDocument',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    proposalId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'proposal_id',
      references: { model: Proposal, key: 'id' },
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
    tableName: 'crm_proposal_documents',
    timestamps: true,
  }
);

ProposalDocument.belongsTo(Proposal, {
  foreignKey: 'proposalId',
  as: 'proposal',
});

ProposalDocument.belongsTo(User, {
  foreignKey: 'uploadedBy',
  as: 'uploadedByUser',
  constraints: false,
});

Proposal.hasMany(ProposalDocument, {
  foreignKey: 'proposalId',
  as: 'documents',
});

module.exports = ProposalDocument;
