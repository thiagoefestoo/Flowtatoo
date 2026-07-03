const { Op } = require('sequelize');

const sequelize = require('../../config/db');
const Product = require('../models/product');
const StockMovement = require('../models/stockMovement');
const User = require('../models/user');
const { registerAuditLog } = require('../services/auditService');

function toNumber(value) {
  if (value === undefined || value === null || value === '') return 0;

  if (typeof value === 'string') {
    return Number(value.replace(/\./g, '').replace(',', '.'));
  }

  return Number(value);
}

function buildDateFrom(value) {
  if (!value) return null;
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildDateTo(value) {
  if (!value) return null;
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

async function getAllStockMovements(req, res) {
  try {
    const { productId, type, dateFrom, dateTo } = req.query;

    const where = {};

    if (productId) where.productId = productId;
    if (type) where.type = type;

    if (dateFrom || dateTo) {
      where.createdAt = {};

      if (dateFrom) {
        where.createdAt[Op.gte] = buildDateFrom(dateFrom);
      }

      if (dateTo) {
        where.createdAt[Op.lte] = buildDateTo(dateTo);
      }
    }

    const movements = await StockMovement.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'category', 'unit', 'currentStock'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: movements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar movimentacoes de estoque.',
      error: error.message,
    });
  }
}

async function getStockStats(req, res) {
  try {
    const totalMovements = await StockMovement.count();
    const entradas = await StockMovement.count({ where: { type: 'entrada' } });
    const saidas = await StockMovement.count({ where: { type: 'saida' } });
    const ajustes = await StockMovement.count({ where: { type: 'ajuste' } });

    const products = await Product.findAll();

    const baixoEstoque = products.filter((product) => {
      if (!product.trackStock) return false;

      return Number(product.currentStock || 0) <= Number(product.minStock || 0);
    }).length;

    const valorEstoque = products.reduce((total, product) => {
      if (!product.trackStock) return total;

      return total + Number(product.currentStock || 0) * Number(product.costPrice || 0);
    }, 0);

    return res.json({
      success: true,
      data: {
        totalMovements,
        entradas,
        saidas,
        ajustes,
        baixoEstoque,
        valorEstoque,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar estatisticas de estoque.',
      error: error.message,
    });
  }
}

async function createStockMovement(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const {
      productId,
      type,
      quantity,
      newStock,
      unitCost,
      reason,
      reference,
      notes,
    } = req.body;

    if (!productId || !type) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Informe produto e tipo da movimentacao.',
      });
    }

    if (!['entrada', 'saida', 'ajuste'].includes(type)) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Tipo de movimentacao invalido.',
      });
    }

    const product = await Product.findByPk(productId, { transaction });

    if (!product) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: 'Produto nao encontrado.',
      });
    }

    if (!product.trackStock) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Este item nao controla estoque.',
      });
    }

    const stockBefore = toNumber(product.currentStock);
    let movementQuantity = toNumber(quantity);
    let stockAfter = stockBefore;

    if (type === 'entrada') {
      if (movementQuantity <= 0) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: 'A quantidade de entrada precisa ser maior que zero.',
        });
      }

      stockAfter = stockBefore + movementQuantity;
    }

    if (type === 'saida') {
      if (movementQuantity <= 0) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: 'A quantidade de saida precisa ser maior que zero.',
        });
      }

      if (movementQuantity > stockBefore) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: 'Estoque insuficiente para esta saida.',
        });
      }

      stockAfter = stockBefore - movementQuantity;
    }

    if (type === 'ajuste') {
      const adjustedStock = toNumber(newStock);

      if (adjustedStock < 0) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: 'O novo estoque nao pode ser negativo.',
        });
      }

      movementQuantity = Math.abs(adjustedStock - stockBefore);
      stockAfter = adjustedStock;
    }

    const parsedUnitCost = toNumber(unitCost || product.costPrice);
    const totalCost = movementQuantity * parsedUnitCost;

    const movement = await StockMovement.create(
      {
        productId,
        userId: req.userId,
        type,
        quantity: movementQuantity,
        stockBefore,
        stockAfter,
        unitCost: parsedUnitCost,
        totalCost,
        reason,
        reference,
        notes,
      },
      { transaction }
    );

    await product.update(
      {
        currentStock: stockAfter,
      },
      { transaction }
    );

    await registerAuditLog({
      entityType: 'stock_movement',
      entityId: movement.id,
      action: 'stock_movement_created',
      description: `Movimentacao de estoque registrada para ${product.name}.`,
      userId: req.userId,
      metadata: {
        productId: product.id,
        productName: product.name,
        type,
        quantity: movementQuantity,
        stockBefore,
        stockAfter,
        unitCost: parsedUnitCost,
        totalCost,
        reason,
        reference,
      },
      transaction,
    });

    await transaction.commit();

    const movementWithProduct = await StockMovement.findByPk(movement.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'category', 'unit', 'currentStock'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Movimentacao registrada com sucesso.',
      data: movementWithProduct,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar movimentacao de estoque.',
      error: error.message,
    });
  }
}

module.exports = {
  getAllStockMovements,
  getStockStats,
  createStockMovement,
};