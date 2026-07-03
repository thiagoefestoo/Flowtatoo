const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const TattooArtist = sequelize.define('TattooArtist', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(180), allowNull: false },
  phone: { type: DataTypes.STRING(40), allowNull: true },
  email: { type: DataTypes.STRING(180), allowNull: true },
  instagram: { type: DataTypes.STRING(160), allowNull: true },
  specialties: { type: DataTypes.STRING(255), allowNull: true },
  commissionPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 50, field: 'commission_percent' },
  color: { type: DataTypes.STRING(30), allowNull: false, defaultValue: '#7c3aed' },
  status: { type: DataTypes.ENUM('ativo','folga','inativo'), allowNull: false, defaultValue: 'ativo' },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'flowtattoo_artists',
  timestamps: true,
});

module.exports = TattooArtist;
