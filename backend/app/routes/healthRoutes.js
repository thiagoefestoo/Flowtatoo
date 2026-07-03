const express = require('express');

const sequelize = require('../../config/db');

const router = express.Router();

router.get('/', (req, res) => {
  return res.json({
    success: true,
    service: 'Flowtatoo API',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

router.get('/db', async (req, res) => {
  try {
    await sequelize.authenticate();

    return res.json({
      success: true,
      database: 'postgres',
      message: 'Banco conectado com sucesso.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao conectar com o banco de dados.',
      error: error.message,
    });
  }
});

module.exports = router;