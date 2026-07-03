const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL não configurada. Crie um arquivo .env dentro da pasta backend.');
}

if (
  !databaseUrl.startsWith('postgresql://') &&
  !databaseUrl.startsWith('postgres://')
) {
  throw new Error('DATABASE_URL inválida. Ela precisa começar com postgresql:// ou postgres://.');
}

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    options: '-c client_encoding=UTF8',
    ssl: {
      require: true,
      // Necessário para conexões Neon/Render/Vercel em ambiente local e cloud.
      // Em produção com certificado próprio, pode ser ajustado para true.
      rejectUnauthorized: false,
    },
  },
  pool: {
    max: isProduction ? 10 : 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
