require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

// Apenas os modelos usados pelo Flowtatoo são carregados no boot.
require('./app/models/user');
if (process.env.AUDIT_ENABLED === 'true') {
  require('./app/models/auditLog');
}
require('./app/models/tattooClient');
require('./app/models/tattooArtist');
require('./app/models/tattooAppointment');

const authRoutes = require('./app/routes/authRoutes');
const healthRoutes = require('./app/routes/healthRoutes');
const alertRoutes = require('./app/routes/alertRoutes');
const tattooClientRoutes = require('./app/routes/tattooClientRoutes');
const tattooArtistRoutes = require('./app/routes/tattooArtistRoutes');
const tattooAppointmentRoutes = require('./app/routes/tattooAppointmentRoutes');
const tattooDashboardRoutes = require('./app/routes/tattooDashboardRoutes');

const app = express();

app.disable('x-powered-by');
app.set('json escape', false);

app.use((req, res, next) => {
  res.setHeader('Content-Language', 'pt-BR');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.charset = 'utf-8';

  const originalJson = res.json.bind(res);
  res.json = function jsonWithUtf8(body) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(body);
  };

  next();
});

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = allowedOrigins.length
  ? {
      origin(origin, callback) {
        const normalizedOrigin = origin?.replace(/\/$/, '');
        if (!origin || allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        return callback(new Error('Origem não permitida pelo CORS.'));
      },
    }
  : undefined;

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  return res.json({
    success: true,
    message: 'Flowtatoo API online.',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/tattoo-dashboard', tattooDashboardRoutes);
app.use('/api/tattoo-clients', tattooClientRoutes);
app.use('/api/tattoo-artists', tattooArtistRoutes);
app.use('/api/tattoo-appointments', tattooAppointmentRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.query("SET client_encoding TO 'UTF8';");
    console.log('Banco conectado com sucesso.');

    if (process.env.DB_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      console.log('Modelos do Flowtatoo sincronizados com o banco.');
    }

    const PORT = process.env.PORT || 3001;

    app.listen(PORT, () => {
      console.log(`Flowtatoo API rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
