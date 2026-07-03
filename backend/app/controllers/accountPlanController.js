const { Op } = require('sequelize');
const AccountPlan = require('../models/accountPlan');

async function listAccountPlans(req, res) {
  try {
    const { search, type, status } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const accountPlans = await AccountPlan.findAll({
      where,
      order: [
        ['code', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return res.json({
      success: true,
      data: accountPlans,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar plano de contas.',
      error: error.message,
    });
  }
}

async function getAccountPlanById(req, res) {
  try {
    const accountPlan = await AccountPlan.findByPk(req.params.id);

    if (!accountPlan) {
      return res.status(404).json({
        success: false,
        message: 'Conta nao encontrada.',
      });
    }

    return res.json({
      success: true,
      data: accountPlan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar conta.',
      error: error.message,
    });
  }
}

async function createAccountPlan(req, res) {
  try {
    const {
      code,
      name,
      type,
      nature,
      status,
      parentCode,
      level,
      notes,
    } = req.body;

    if (!code || !name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Informe codigo, nome e tipo da conta.',
      });
    }

    const existingAccount = await AccountPlan.findOne({
      where: {
        code: code.trim(),
      },
    });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: 'Ja existe uma conta com este codigo.',
      });
    }

    const accountPlan = await AccountPlan.create({
      code: code.trim(),
      name: name.trim(),
      type,
      nature: nature || 'neutro',
      status: status || 'ativo',
      parentCode: parentCode || null,
      level: level || 1,
      notes: notes || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso.',
      data: accountPlan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar conta.',
      error: error.message,
    });
  }
}

async function updateAccountPlan(req, res) {
  try {
    const accountPlan = await AccountPlan.findByPk(req.params.id);

    if (!accountPlan) {
      return res.status(404).json({
        success: false,
        message: 'Conta nao encontrada.',
      });
    }

    const {
      code,
      name,
      type,
      nature,
      status,
      parentCode,
      level,
      notes,
    } = req.body;

    if (!code || !name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Informe codigo, nome e tipo da conta.',
      });
    }

    const existingAccount = await AccountPlan.findOne({
      where: {
        code: code.trim(),
        id: {
          [Op.ne]: accountPlan.id,
        },
      },
    });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: 'Ja existe outra conta com este codigo.',
      });
    }

    await accountPlan.update({
      code: code.trim(),
      name: name.trim(),
      type,
      nature: nature || 'neutro',
      status: status || 'ativo',
      parentCode: parentCode || null,
      level: level || 1,
      notes: notes || null,
    });

    return res.json({
      success: true,
      message: 'Conta atualizada com sucesso.',
      data: accountPlan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar conta.',
      error: error.message,
    });
  }
}

async function deleteAccountPlan(req, res) {
  try {
    const accountPlan = await AccountPlan.findByPk(req.params.id);

    if (!accountPlan) {
      return res.status(404).json({
        success: false,
        message: 'Conta nao encontrada.',
      });
    }

    await accountPlan.destroy();

    return res.json({
      success: true,
      message: 'Conta removida com sucesso.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao remover conta.',
      error: error.message,
    });
  }
}

async function getAccountPlanStats(req, res) {
  try {
    const total = await AccountPlan.count();
    const ativos = await AccountPlan.count({ where: { status: 'ativo' } });
    const inativos = await AccountPlan.count({ where: { status: 'inativo' } });

    const receitas = await AccountPlan.count({ where: { type: 'receita' } });
    const despesas = await AccountPlan.count({ where: { type: 'despesa' } });
    const custos = await AccountPlan.count({ where: { type: 'custo' } });

    return res.json({
      success: true,
      data: {
        total,
        ativos,
        inativos,
        receitas,
        despesas,
        custos,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar indicadores do plano de contas.',
      error: error.message,
    });
  }
}

module.exports = {
  listAccountPlans,
  getAccountPlanById,
  createAccountPlan,
  updateAccountPlan,
  deleteAccountPlan,
  getAccountPlanStats,
};