const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const TattooClient = require('./tattooClient');
const TattooArtist = require('./tattooArtist');

const TattooAppointment = sequelize.define('TattooAppointment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  clientId: { type: DataTypes.UUID, allowNull: false, field: 'client_id' },
  artistId: { type: DataTypes.UUID, allowNull: false, field: 'artist_id' },
  title: { type: DataTypes.STRING(180), allowNull: false },
  serviceType: { type: DataTypes.ENUM('orcamento','tattoo','retoque','avaliacao','remocao','piercing','outro'), allowNull: false, defaultValue: 'tattoo', field: 'service_type' },
  style: { type: DataTypes.STRING(120), allowNull: true },
  bodyArea: { type: DataTypes.STRING(120), allowNull: true, field: 'body_area' },
  sizeLabel: { type: DataTypes.STRING(80), allowNull: true, field: 'size_label' },
  appointmentDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'appointment_date' },
  startTime: { type: DataTypes.TIME, allowNull: false, field: 'start_time' },
  endTime: { type: DataTypes.TIME, allowNull: true, field: 'end_time' },
  estimatedMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 120, field: 'estimated_minutes' },
  price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  deposit: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  paidAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0, field: 'paid_amount' },
  paymentMethod: { type: DataTypes.ENUM('nao_informado','pix','dinheiro','cartao_credito','cartao_debito','transferencia','outro'), allowNull: false, defaultValue: 'nao_informado', field: 'payment_method' },
  paymentNotes: { type: DataTypes.TEXT, allowNull: true, field: 'payment_notes' },
  paymentStatus: { type: DataTypes.ENUM('pendente','sinal_pago','pago','parcial','cancelado'), allowNull: false, defaultValue: 'pendente', field: 'payment_status' },
  status: { type: DataTypes.ENUM('orcamento','aguardando_sinal','agendado','confirmado','em_atendimento','finalizado','cancelado','reagendado'), allowNull: false, defaultValue: 'agendado' },
  confirmationStatus: { type: DataTypes.ENUM('nao_enviado','aguardando_cliente','confirmado','sem_resposta'), allowNull: false, defaultValue: 'nao_enviado', field: 'confirmation_status' },
  reminderMinutesBefore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1440, field: 'reminder_minutes_before' },
  priority: { type: DataTypes.ENUM('normal','alta','urgente'), allowNull: false, defaultValue: 'normal' },
  referenceUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'reference_url' },
  careInstructionsSent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'care_instructions_sent' },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'flowtattoo_appointments',
  timestamps: true,
  indexes: [
    { fields: ['appointment_date'] },
    { fields: ['status'] },
    { fields: ['payment_status'] },
    { fields: ['confirmation_status'] },
    { fields: ['client_id'] },
    { fields: ['artist_id', 'appointment_date'] },
  ],
});

TattooAppointment.belongsTo(TattooClient, { foreignKey: 'clientId', as: 'client' });
TattooAppointment.belongsTo(TattooArtist, { foreignKey: 'artistId', as: 'artist' });
TattooClient.hasMany(TattooAppointment, { foreignKey: 'clientId', as: 'appointments' });
TattooArtist.hasMany(TattooAppointment, { foreignKey: 'artistId', as: 'appointments' });

module.exports = TattooAppointment;
