const bcrypt = require('bcryptjs');
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

async function getAllUsers(req, res) {
  try {
    const { q, role, status } = req.query;

    const where = {};

    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (role) where.role = role;
    if (status) where.status = status;

    const users = await User.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: users.map(sanitizeUser),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar usuarios.',
      error: error.message,
    });
  }
}

async function getUserStats(req, res) {
  try {
    const total = await User.count();
    const ativos = await User.count({ where: { status: 'ativo' } });
    const inativos = await User.count({ where: { status: 'inativo' } });
    const bloqueados = await User.count({ where: { status: 'bloqueado' } });

    const admins = await User.count({ where: { role: 'admin' } });
    const gestores = await User.count({ where: { role: 'gestor' } });
    const operadores = await User.count({ where: { role: 'operador' } });
    const rhs = await User.count({ where: { role: 'rh' } });
    const entrevistadores = await User.count({ where: { role: 'entrevistador' } });
    const colaboradores = await User.count({ where: { role: 'colaborador' } });
    const financeiros = await User.count({ where: { role: 'financeiro' } });
    const vendedores = await User.count({ where: { role: 'vendedor' } });
    const viewers = await User.count({ where: { role: 'viewer' } });

    return res.json({
      success: true,
      data: {
        total,
        ativos,
        inativos,
        bloqueados,
        admins,
        gestores,
        operadores,
        rhs,
        entrevistadores,
        colaboradores,
        financeiros,
        vendedores,
        viewers,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar estatisticas de usuarios.',
      error: error.message,
    });
  }
}

async function getUserById(req, res) {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario nao encontrado.',
      });
    }

    return res.json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuario.',
      error: error.message,
    });
  }
}

async function createUser(req, res) {
  try {
    const {
      name,
      email,
      password,
      role = 'viewer',
      status = 'ativo',
      notes,
    } = req.body;

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

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Ja existe um usuario com este e-mail.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      status,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: 'Usuario criado com sucesso.',
      data: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar usuario.',
      error: error.message,
    });
  }
}

async function updateUser(req, res) {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario nao encontrado.',
      });
    }

    const { name, email, password, role, status, notes } = req.body;
    const payload = {};

    if (name !== undefined) payload.name = name.trim();

    if (email !== undefined) {
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

      payload.email = normalizedEmail;
    }

    if (role !== undefined) payload.role = role;
    if (status !== undefined) payload.status = status;
    if (notes !== undefined) payload.notes = notes;

    if (password) {
      if (String(password).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'A senha precisa ter pelo menos 6 caracteres.',
        });
      }

      payload.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.update(payload);

    return res.json({
      success: true,
      message: 'Usuario atualizado com sucesso.',
      data: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuario.',
      error: error.message,
    });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario nao encontrado.',
      });
    }

    if (req.user && req.user.id === user.id) {
      return res.status(400).json({
        success: false,
        message: 'Voce nao pode inativar o proprio usuario logado.',
      });
    }

    await user.update({
      status: 'inativo',
    });

    return res.json({
      success: true,
      message: 'Usuario inativado com sucesso.',
      data: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao inativar usuario.',
      error: error.message,
    });
  }
}

module.exports = {
  getAllUsers,
  getUserStats,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};