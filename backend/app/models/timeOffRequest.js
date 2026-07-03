const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const TimeOffRequest = sequelize.define('TimeOffRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  employeeName: { type: DataTypes.STRING(180), allowNull: false, field: 'employee_name' },
  type: { type: DataTypes.ENUM('ferias','atestado','licenca','afastamento','ausencia_justificada','banco_horas'), allowNull: false, defaultValue: 'ferias' },
  startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },
  status: { type: DataTypes.ENUM('solicitado','em_analise','aprovado','reprovado','cancelado','concluido'), allowNull: false, defaultValue: 'solicitado' },
  approvedBy: { type: DataTypes.STRING(140), allowNull: true, field: 'approved_by' },
  reason: { type: DataTypes.TEXT, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'flowtatoo_time_off_requests', timestamps: true });

module.exports = TimeOffRequest;
