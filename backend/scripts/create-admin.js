require('dotenv').config();

const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const User = require('../app/models/user');

async function createAdmin() {
  try {
    await sequelize.authenticate();

    await sequelize.sync({ alter: true });

    const email = 'admin@flowtatoo.com';
    const password = 'Admin@12345';

    const passwordHash = await bcrypt.hash(password, 10);

    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        name: 'Dono do Estúdio',
        email,
        passwordHash,
        role: 'admin',
        status: 'ativo',
        notes: 'Usuário único do estúdio criado automaticamente.',
      },
    });

    if (!created) {
      await user.update({
        name: 'Dono do Estúdio',
        passwordHash,
        role: 'admin',
        status: 'ativo',
      });
    }

    console.log('Usuário único do estúdio pronto para login:');
    console.log('E-mail:', email);
    console.log('Senha:', password);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar administrador:', error);
    process.exit(1);
  }
}

createAdmin();