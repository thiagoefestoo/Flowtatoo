const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const TattooClient = sequelize.define('TattooClient', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(180), allowNull: false },
  phone: { type: DataTypes.STRING(40), allowNull: false },
  whatsapp: { type: DataTypes.STRING(40), allowNull: true },
  email: { type: DataTypes.STRING(180), allowNull: true },
  birthDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'birth_date' },
  cpf: { type: DataTypes.STRING(20), allowNull: true },
  city: { type: DataTypes.STRING(120), allowNull: true },
  instagram: { type: DataTypes.STRING(160), allowNull: true },
  source: { type: DataTypes.ENUM('instagram','whatsapp','indicacao','google','retorno','outro'), allowNull: false, defaultValue: 'whatsapp' },
  allergies: { type: DataTypes.TEXT, allowNull: true },
  medicalNotes: { type: DataTypes.TEXT, allowNull: true, field: 'medical_notes' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('ativo','vip','em_observacao','inativo'), allowNull: false, defaultValue: 'ativo' },
}, {
  tableName: 'flowtattoo_clients',
  timestamps: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['phone'] },
    { fields: ['status'] },
    { fields: ['birth_date'] },
  ],
});

module.exports = TattooClient;
