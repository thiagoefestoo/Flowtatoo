const { Op } = require('sequelize');

const { registerAuditLog } = require('../services/auditService');

function cleanPayload(payload) {
  const output = { ...payload };

  Object.keys(output).forEach((key) => {
    if (output[key] === '') {
      output[key] = null;
    }
  });

  return output;
}

function buildSearchWhere(searchFields, query) {
  const where = {};

  if (query.q && searchFields.length > 0) {
    where[Op.or] = searchFields.map((field) => ({
      [field]: { [Op.iLike]: `%${query.q}%` },
    }));
  }

  Object.entries(query).forEach(([key, value]) => {
    if (!value || key === 'q') return;
    where[key] = value;
  });

  return where;
}

function createCrudController({
  model,
  entityType,
  label,
  requiredFields = [],
  searchFields = [],
  include = [],
  order = [['createdAt', 'DESC']],
}) {
  async function getAll(req, res) {
    try {
      const where = buildSearchWhere(searchFields, req.query || {});

      const data = await model.findAll({
        where,
        include,
        order,
      });

      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Erro ao listar ${label}.`,
        error: error.message,
      });
    }
  }

  async function getById(req, res) {
    try {
      const item = await model.findByPk(req.params.id, { include });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: `${label} nao encontrado.`,
        });
      }

      return res.json({ success: true, data: item });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Erro ao buscar ${label}.`,
        error: error.message,
      });
    }
  }

  async function create(req, res) {
    try {
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            message: `Campo obrigatorio nao informado: ${field}.`,
          });
        }
      }

      const payload = cleanPayload(req.body);

      if ('ownerId' in model.rawAttributes && !payload.ownerId) {
        payload.ownerId = req.userId || req.user?.id || null;
      }

      const item = await model.create(payload);

      await registerAuditLog({
        entityType,
        entityId: item.id,
        action: `${entityType}_created`,
        description: `${label} criado.`,
        userId: req.userId,
        metadata: item.toJSON(),
      });

      return res.status(201).json({
        success: true,
        message: `${label} criado com sucesso.`,
        data: item,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Erro ao criar ${label}.`,
        error: error.message,
      });
    }
  }

  async function update(req, res) {
    try {
      const item = await model.findByPk(req.params.id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: `${label} nao encontrado.`,
        });
      }

      const previous = item.toJSON();
      const payload = cleanPayload(req.body);

      await item.update(payload);

      await registerAuditLog({
        entityType,
        entityId: item.id,
        action: `${entityType}_updated`,
        description: `${label} atualizado.`,
        userId: req.userId,
        metadata: {
          previous,
          current: item.toJSON(),
        },
      });

      return res.json({
        success: true,
        message: `${label} atualizado com sucesso.`,
        data: item,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Erro ao atualizar ${label}.`,
        error: error.message,
      });
    }
  }

  async function remove(req, res) {
    try {
      const item = await model.findByPk(req.params.id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: `${label} nao encontrado.`,
        });
      }

      const metadata = item.toJSON();
      await item.destroy();

      await registerAuditLog({
        entityType,
        entityId: req.params.id,
        action: `${entityType}_deleted`,
        description: `${label} excluido.`,
        userId: req.userId,
        metadata,
      });

      return res.json({
        success: true,
        message: `${label} excluido com sucesso.`,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Erro ao excluir ${label}.`,
        error: error.message,
      });
    }
  }

  return {
    getAll,
    getById,
    create,
    update,
    delete: remove,
  };
}

module.exports = createCrudController;
