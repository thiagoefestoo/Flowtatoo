const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/user');

function sanitizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    notes: user.notes,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    }
  );
}

async function setupAdmin(req, res) {
  try {
    const { name, email, password, setupKey } = req.body;

    const existingUsers = await User.count();

    if (existingUsers > 0) {
      return res.status(409).json({
        success: false,
        message: 'O administrador inicial ja foi criado.',
      });
    }

    if (
      process.env.SETUP_ADMIN_KEY &&
      setupKey !== process.env.SETUP_ADMIN_KEY
    ) {
      return res.status(403).json({
        success: false,
        message: 'Chave de configuracao invalida.',
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Informe nome, e-mail e senha.',
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha precisa ter pelo menos 6 caracteres.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'admin',
      status: 'ativo',
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: 'Administrador inicial criado com sucesso.',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar administrador inicial.',
      error: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Informe e-mail e senha.',
      });
    }

    const user = await User.findOne({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'E-mail ou senha invalidos.',
      });
    }

    if (user.status !== 'ativo') {
      return res.status(403).json({
        success: false,
        message: 'Usuario inativo ou bloqueado.',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'E-mail ou senha invalidos.',
      });
    }

    await user.update({
      lastLoginAt: new Date(),
    });

    const token = createToken(user);

    return res.json({
      success: true,
      message: 'Login realizado com sucesso.',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao realizar login.',
      error: error.message,
    });
  }
}

async function me(req, res) {
  return res.json({
    success: true,
    data: sanitizeUser(req.user),
  });
}

async function logout(req, res) {
  return res.json({
    success: true,
    message: 'Logout realizado com sucesso.',
  });
}
async function updateMe(req, res) {
  try {
    const userId = req.userId || req.user?.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario nao encontrado.',
      });
    }

    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Informe nome e e-mail.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      where: {
        email: normalizedEmail,
        id: {
          [Op.ne]: user.id,
        },
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Ja existe outro usuario com este e-mail.',
      });
    }

    await user.update({
      name: name.trim(),
      email: normalizedEmail,
    });

    return res.json({
      success: true,
      message: 'Perfil atualizado com sucesso.',
      data: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil.',
      error: error.message,
    });
  }
}

async function changePassword(req, res) {
  try {
    const userId = req.userId || req.user?.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario nao encontrado.',
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Informe senha atual, nova senha e confirmacao.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'A confirmacao da senha nao confere.',
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A nova senha precisa ter pelo menos 6 caracteres.',
      });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await user.update({
      passwordHash,
    });

    return res.json({
      success: true,
      message: 'Senha alterada com sucesso.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao alterar senha.',
      error: error.message,
    });
  }
}


module.exports = {
  setupAdmin,
  login,
  me,
  updateMe,
  changePassword,
  logout,
};