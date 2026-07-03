const jwt = require('jsonwebtoken');

const User = require('../models/user');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticacao nao informado.',
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario nao encontrado.',
      });
    }

    if (user.status !== 'ativo') {
      return res.status(403).json({
        success: false,
        message: 'Usuario inativo ou bloqueado.',
      });
    }

    req.user = user;
    req.userId = user.id;

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Sessao invalida ou expirada.',
    });
  }
}

function requireRoles(...allowedRoles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario nao autenticado.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Voce nao possui permissao para realizar esta acao.',
      });
    }

    return next();
  };
}

const requireAdmin = requireRoles('admin');

const requireManager = requireRoles('admin', 'rh', 'gestor');

const requireOperator = requireRoles(
  'admin',
  'rh',
  'gestor',
  'operador'
);

const requireFinance = requireRoles(
  'admin',
  'rh',
  'gestor',
  'financeiro'
);

const requireSales = requireRoles(
  'admin',
  'rh',
  'gestor',
  'vendedor'
);

const requireViewer = requireRoles(
  'admin',
  'rh',
  'gestor',
  'operador',
  'financeiro',
  'vendedor',
  'viewer',
  'entregador'
);

module.exports = {
  requireAuth,
  requireRoles,
  requireAdmin,
  requireManager,
  requireOperator,
  requireFinance,
  requireSales,
  requireViewer,
};