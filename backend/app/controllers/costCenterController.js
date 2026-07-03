const { Op } = require('sequelize');

const CostCenter = require('../models/costCenter');

function sanitizeCostCenter(costCenter) {
  if (!costCenter) return null;

  return {
    id: costCenter.id,
    code: costCenter.code,
    name: costCenter.name,
    type: costCenter.type,
    status: costCenter.status,
    responsibleName: costCenter.responsibleName,
    budgetLimit: Number(costCenter.budgetLimit || 0),
    notes: costCenter.notes,
    createdAt: costCenter.createdAt,
    updatedAt: costCenter.updatedAt,
  };
}

async function getAllCostCenters(req, res) {
  try {
    const { q, type, status } = req.query;
    const where = {};

    if (q) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${q}%` } },
        { name: { [Op.iLike]: `%${q}%` } },
        { responsibleName: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (type) where.type = type;
    if (status) where.status = status;

    const costCenters = await CostCenter.findAll({
      where,
      order: [['code', 'ASC']],
    });

    return res.json({
      success: true,
      data: costCenters.map(sanitizeCostCenter),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar centros de custo.',
      error: error.message,
    });
  }
}

async function getCostCenterStats(req, res) {
  try {
    const total = await CostCenter.count();
    const ativos = await CostCenter.count({ where: { status: 'ativo' } });
    const inativos = await CostCenter.count({ where: { status: 'inativo' } });
    const budgetTotal = await CostCenter.sum('budgetLimit');

    return res.json({
      success: true,
      data: {
        total,
        ativos,
        inativos,
        budgetTotal: Number(budgetTotal || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar estatisticas de centros de custo.',
      error: error.message,
    });
  }
}

async function createCostCenter(req, res) {
  try {
    const {
      code,
      name,
      type = 'operacional',
      status = 'ativo',
      responsibleName,
      budgetLimit = 0,
      notes,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'Informe codigo e nome do centro de custo.',
      });
    }

    const existingCostCenter = await CostCenter.findOne({
      where: { code: code.trim() },
    });

    if (existingCostCenter) {
      return res.status(409).json({
        success: false,
        message: 'Ja existe um centro de custo com este codigo.',
      });
    }

    const costCenter = await CostCenter.create({
      code: code.trim(),
      name: name.trim(),
      type,
      status,
      responsibleName,
      budgetLimit,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: 'Centro de custo criado com sucesso.',
      data: sanitizeCostCenter(costCenter),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar centro de custo.',
      error: error.message,
    });
  }
}

async function updateCostCenter(req, res) {
  try {
    const costCenter = await CostCenter.findByPk(req.params.id);

    if (!costCenter) {
      return res.status(404).json({
        success: false,
        message: 'Centro de custo nao encontrado.',
      });
    }

    const payload = { ...req.body };

    if (payload.code !== undefined) {
      const normalizedCode = payload.code.trim();

      const existingCostCenter = await CostCenter.findOne({
        where: {
          code: normalizedCode,
          id: { [Op.ne]: costCenter.id },
        },
      });

      if (existingCostCenter) {
        return res.status(409).json({
          success: false,
          message: 'Ja existe outro centro de custo com este codigo.',
        });
      }

      payload.code = normalizedCode;
    }

    if (payload.name !== undefined) payload.name = payload.name.trim();

    await costCenter.update(payload);

    return res.json({
      success: true,
      message: 'Centro de custo atualizado com sucesso.',
      data: sanitizeCostCenter(costCenter),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar centro de custo.',
      error: error.message,
    });
  }
}

async function deleteCostCenter(req, res) {
  try {
    const costCenter = await CostCenter.findByPk(req.params.id);

    if (!costCenter) {
      return res.status(404).json({
        success: false,
        message: 'Centro de custo nao encontrado.',
      });
    }

    await costCenter.update({ status: 'inativo' });

    return res.json({
      success: true,
      message: 'Centro de custo inativado com sucesso.',
      data: sanitizeCostCenter(costCenter),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao inativar centro de custo.',
      error: error.message,
    });
  }
}

module.exports = {
  getAllCostCenters,
  getCostCenterStats,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,
};