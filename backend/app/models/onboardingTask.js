const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const OnboardingTask = sequelize.define('OnboardingTask', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  employeeName: { type: DataTypes.STRING(180), allowNull: false, field: 'employee_name' },
  title: { type: DataTypes.STRING(180), allowNull: false },
  responsibleName: { type: DataTypes.STRING(140), allowNull: true, field: 'responsible_name' },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'due_date' },
  status: { type: DataTypes.ENUM('pendente','em_andamento','concluida','atrasada','cancelada'), allowNull: false, defaultValue: 'pendente' },
  category: { type: DataTypes.ENUM('documentos','acessos','equipamentos','integracao','treinamento','outro'), allowNull: false, defaultValue: 'integracao' },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'flowtatoo_onboarding_tasks', timestamps: true });

module.exports = OnboardingTask;
