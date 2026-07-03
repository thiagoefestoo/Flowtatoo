const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Termination = sequelize.define('Termination', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  employeeName: { type: DataTypes.STRING(180), allowNull: false, field: 'employee_name' },
  jobTitle: { type: DataTypes.STRING(180), allowNull: true, field: 'job_title' },
  type: { type: DataTypes.ENUM('pedido_demissao','empresa_sem_justa_causa','empresa_com_justa_causa','termino_contrato','acordo'), allowNull: false, defaultValue: 'pedido_demissao' },
  requestedAt: { type: DataTypes.DATEONLY, allowNull: true, field: 'requested_at' },
  lastDay: { type: DataTypes.DATEONLY, allowNull: true, field: 'last_day' },
  status: { type: DataTypes.ENUM('em_andamento','aviso_previo','documentos_pendentes','concluido','cancelado'), allowNull: false, defaultValue: 'em_andamento' },
  accessBlocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'access_blocked' },
  equipmentReturned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'equipment_returned' },
  exitInterviewDone: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'exit_interview_done' },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'flowtatoo_terminations', timestamps: true });

module.exports = Termination;
