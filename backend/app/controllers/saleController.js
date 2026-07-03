const sequelize = require('../../config/db');

const Customer = require('../models/customer');
const Product = require('../models/product');
const Sale = require('../models/sale');
const SaleItem = require('../models/saleItem');
const StockMovement = require('../models/stockMovement');
const User = require('../models/user');
const FinancialEntry = require('../models/financialEntry');
const { registerAuditLog } = require('../services/auditService');

function toNumber(value) {
  if (value === undefined || value === null || value === '') return 0;

  if (typeof value === 'string') {
    return Number(value.replace(/\./g, '').replace(',', '.'));
  }

  return Number(value);
}

async function getSaleWithItems(id) {
  return Sale.findByPk(id, {
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'tradeName', 'document'],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: SaleItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'unit', 'currentStock', 'trackStock'],
          },
        ],
      },
    ],
  });
}

async function getAllSales(req, res) {
  try {
    const sales = await Sale.findAll({
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'tradeName', 'document'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'unit'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: sales,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar vendas.',
      error: error.message,
    });
  }
}

async function getSaleStats(req, res) {
  try {
    const total = await Sale.count();
    const confirmadas = await Sale.count({ where: { status: 'confirmada' } });
    const rascunhos = await Sale.count({ where: { status: 'rascunho' } });
    const canceladas = await Sale.count({ where: { status: 'cancelada' } });

    const pendentesAprovacao = await Sale.count({
      where: {
        approvalStatus: 'pendente',
      },
    });

    const aprovadas = await Sale.count({
      where: {
        approvalStatus: 'aprovado',
      },
    });

    const reprovadas = await Sale.count({
      where: {
        approvalStatus: 'reprovado',
      },
    });

    const totalVendido = await Sale.sum('total', {
      where: {
        status: 'confirmada',
      },
    });

    return res.json({
      success: true,
      data: {
        total,
        confirmadas,
        rascunhos,
        canceladas,
        pendentesAprovacao,
        aprovadas,
        reprovadas,
        totalVendido: Number(totalVendido || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar estatisticas de vendas.',
      error: error.message,
    });
  }
}

async function createSale(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const {
      customerId,
      number,
      issueDate,
      paymentStatus = 'pendente',
      discount = 0,
      freight = 0,
      notes,
      items,
    } = req.body;

    if (!customerId) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Informe o cliente.',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Informe pelo menos um item da venda.',
      });
    }

    const customer = await Customer.findByPk(customerId, { transaction });

    if (!customer) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: 'Cliente nao encontrado.',
      });
    }

    const parsedItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });

      if (!product) {
        await transaction.rollback();

        return res.status(404).json({
          success: false,
          message: 'Produto informado nao encontrado.',
        });
      }

      const quantity = toNumber(item.quantity);
      const unitPrice = toNumber(item.unitPrice || product.salePrice);

      if (quantity <= 0) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: 'A quantidade dos itens precisa ser maior que zero.',
        });
      }

      parsedItems.push({
        product,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      });
    }

    const subtotal = parsedItems.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - toNumber(discount) + toNumber(freight);
    const saleNumber = number || `VENDA-${Date.now()}`;

    const sale = await Sale.create(
      {
        customerId,
        userId: req.userId,
        number: saleNumber,
        issueDate: issueDate || new Date(),
        status: 'rascunho',
        approvalStatus: 'nao_enviado',
        paymentStatus,
        subtotal,
        discount: toNumber(discount),
        freight: toNumber(freight),
        total,
        notes,
      },
      { transaction }
    );

    for (const item of parsedItems) {
      await SaleItem.create(
        {
          saleId: sale.id,
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        },
        { transaction }
      );
    }

    await registerAuditLog({
      entityType: 'sale',
      entityId: sale.id,
      action: 'sale_created',
      description: `Venda ${sale.number} criada como rascunho.`,
      userId: req.userId,
      metadata: {
        number: sale.number,
        total: Number(sale.total || 0),
        customerId: sale.customerId,
        status: 'rascunho',
        approvalStatus: 'nao_enviado',
      },
      transaction,
    });

    await transaction.commit();

    const saleWithItems = await getSaleWithItems(sale.id);

    return res.status(201).json({
      success: true,
      message: 'Venda criada como rascunho. Envie para aprovacao antes de contabilizar.',
      data: saleWithItems,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      success: false,
      message: 'Erro ao criar venda.',
      error: error.message,
    });
  }
}

async function requestSaleApproval(req, res) {
  try {
    const sale = await Sale.findByPk(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venda nao encontrada.',
      });
    }

    if (sale.status !== 'rascunho') {
      return res.status(400).json({
        success: false,
        message: 'Somente vendas em rascunho podem ser enviadas para aprovacao.',
      });
    }

    if (sale.approvalStatus === 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Esta venda ja esta pendente de aprovacao.',
      });
    }

    await sale.update({
      approvalStatus: 'pendente',
      requestedBy: req.userId,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    });

    await registerAuditLog({
      entityType: 'sale',
      entityId: sale.id,
      action: 'sale_approval_requested',
      description: `Venda ${sale.number} enviada para aprovacao.`,
      userId: req.userId,
      metadata: {
        number: sale.number,
        total: Number(sale.total || 0),
        approvalStatus: 'pendente',
      },
    });

    return res.json({
      success: true,
      message: 'Venda enviada para aprovacao.',
      data: sale,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar venda para aprovacao.',
      error: error.message,
    });
  }
}

async function approveSaleApproval(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
            },
          ],
        },
      ],
      transaction,
    });

    if (!sale) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: 'Venda nao encontrada.',
      });
    }

    if (sale.status === 'confirmada') {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Esta venda ja foi confirmada.',
      });
    }

    if (sale.status === 'cancelada') {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Venda cancelada nao pode ser aprovada.',
      });
    }

    if (sale.approvalStatus !== 'pendente') {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Somente vendas pendentes podem ser aprovadas.',
      });
    }

    if (!sale.items || sale.items.length === 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Venda sem itens nao pode ser aprovada.',
      });
    }

    for (const item of sale.items) {
      const product = item.product;
      const quantity = toNumber(item.quantity);

      if (!product) {
        await transaction.rollback();

        return res.status(404).json({
          success: false,
          message: 'Produto da venda nao encontrado.',
        });
      }

      if (product.trackStock && quantity > toNumber(product.currentStock)) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: `Estoque insuficiente para o produto ${product.name}.`,
        });
      }
    }

    for (const item of sale.items) {
      const product = item.product;
      const quantity = toNumber(item.quantity);

      if (product.trackStock) {
        const stockBefore = toNumber(product.currentStock);
        const stockAfter = stockBefore - quantity;

        await StockMovement.create(
          {
            productId: product.id,
            userId: req.userId,
            type: 'saida',
            quantity,
            stockBefore,
            stockAfter,
            unitCost: product.costPrice,
            totalCost: quantity * toNumber(product.costPrice),
            reason: 'Venda aprovada',
            reference: sale.number,
            notes: `Saida gerada pela aprovacao da venda ${sale.number}`,
          },
          { transaction }
        );

        await product.update(
          {
            currentStock: stockAfter,
          },
          { transaction }
        );
      }
    }

    const existingFinancial = await FinancialEntry.findOne({
      where: {
        type: 'receber',
        reference: sale.number,
      },
      transaction,
    });

    if (!existingFinancial) {
      await FinancialEntry.create(
        {
          type: 'receber',
          description: `Venda ${sale.number}`,
          customerId: sale.customerId,
          userId: req.userId,
          reference: sale.number,
          dueDate: sale.issueDate,
          amount: toNumber(sale.total),
          paidAmount: sale.paymentStatus === 'pago' ? toNumber(sale.total) : 0,
          status: sale.paymentStatus === 'pago' ? 'pago' : 'aberto',
          paymentMethod: null,
          notes: `Lancamento gerado automaticamente pela aprovacao da venda ${sale.number}.`,
        },
        { transaction }
      );
    }

    await sale.update(
      {
        status: 'confirmada',
        approvalStatus: 'aprovado',
        approvedBy: req.userId,
        approvedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
      },
      { transaction }
    );

    await registerAuditLog({
      entityType: 'sale',
      entityId: sale.id,
      action: 'sale_approved',
      description: `Venda ${sale.number} aprovada.`,
      userId: req.userId,
      metadata: {
        number: sale.number,
        total: Number(sale.total || 0),
        status: 'confirmada',
        approvalStatus: 'aprovado',
      },
      transaction,
    });

    await transaction.commit();

    const updatedSale = await getSaleWithItems(sale.id);

    return res.json({
      success: true,
      message: 'Venda aprovada, estoque atualizado e financeiro gerado com sucesso.',
      data: updatedSale,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      success: false,
      message: 'Erro ao aprovar venda.',
      error: error.message,
    });
  }
}

async function rejectSaleApproval(req, res) {
  try {
    const sale = await Sale.findByPk(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venda nao encontrada.',
      });
    }

    if (sale.approvalStatus !== 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Somente vendas pendentes podem ser reprovadas.',
      });
    }

    await sale.update({
      approvalStatus: 'reprovado',
      rejectedBy: req.userId,
      rejectedAt: new Date(),
      rejectionReason: req.body.reason || 'Venda reprovada.',
    });

    await registerAuditLog({
      entityType: 'sale',
      entityId: sale.id,
      action: 'sale_rejected',
      description: `Venda ${sale.number} reprovada.`,
      userId: req.userId,
      metadata: {
        number: sale.number,
        total: Number(sale.total || 0),
        reason: req.body.reason || 'Venda reprovada.',
      },
    });

    return res.json({
      success: true,
      message: 'Venda reprovada com sucesso.',
      data: sale,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao reprovar venda.',
      error: error.message,
    });
  }
}

async function cancelSale(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
            },
          ],
        },
      ],
      transaction,
    });

    if (!sale) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: 'Venda nao encontrada.',
      });
    }

    if (sale.status === 'cancelada') {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Esta venda ja esta cancelada.',
      });
    }

    const wasConfirmed = sale.status === 'confirmada';

    if (wasConfirmed) {
      if (!sale.items || sale.items.length === 0) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: 'Venda confirmada sem itens nao pode ser estornada automaticamente.',
        });
      }

      for (const item of sale.items) {
        const product = item.product;
        const quantity = toNumber(item.quantity);

        if (!product) {
          await transaction.rollback();

          return res.status(404).json({
            success: false,
            message: 'Produto da venda nao encontrado.',
          });
        }

        if (product.trackStock) {
          const stockBefore = toNumber(product.currentStock);
          const stockAfter = stockBefore + quantity;

          await StockMovement.create(
            {
              productId: product.id,
              userId: req.userId,
              type: 'entrada',
              quantity,
              stockBefore,
              stockAfter,
              unitCost: toNumber(product.costPrice),
              totalCost: quantity * toNumber(product.costPrice),
              reason: 'Estorno de venda cancelada',
              reference: sale.number,
              notes: `Entrada gerada pelo cancelamento da venda ${sale.number}`,
            },
            { transaction }
          );

          await product.update(
            {
              currentStock: stockAfter,
            },
            { transaction }
          );
        }
      }

      await FinancialEntry.update(
        {
          status: 'cancelado',
          notes: `Cancelado automaticamente pelo cancelamento da venda ${sale.number}.`,
        },
        {
          where: {
            type: 'receber',
            reference: sale.number,
          },
          transaction,
        }
      );
    }

    await sale.update(
      {
        status: 'cancelada',
      },
      { transaction }
    );

    await registerAuditLog({
      entityType: 'sale',
      entityId: sale.id,
      action: wasConfirmed ? 'sale_reversed_cancelled' : 'sale_cancelled',
      description: wasConfirmed
        ? `Venda ${sale.number} cancelada com estorno de estoque e financeiro.`
        : `Venda ${sale.number} cancelada.`,
      userId: req.userId,
      metadata: {
        number: sale.number,
        total: Number(sale.total || 0),
        wasConfirmed,
        status: 'cancelada',
      },
      transaction,
    });

    await transaction.commit();

    const updatedSale = await getSaleWithItems(sale.id);

    return res.json({
      success: true,
      message: wasConfirmed
        ? 'Venda cancelada com estorno de estoque e financeiro.'
        : 'Venda cancelada com sucesso.',
      data: updatedSale,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      success: false,
      message: 'Erro ao cancelar venda.',
      error: error.message,
    });
  }
}

module.exports = {
  getAllSales,
  getSaleStats,
  createSale,
  requestSaleApproval,
  approveSaleApproval,
  rejectSaleApproval,
  cancelSale,
};