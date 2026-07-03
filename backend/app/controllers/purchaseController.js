const sequelize = require('../../config/db');

const AccountPlan = require('../models/accountPlan');
const CostCenter = require('../models/costCenter');
const FinancialEntry = require('../models/financialEntry');
const Product = require('../models/product');
const Purchase = require('../models/purchase');
const PurchaseItem = require('../models/purchaseItem');
const StockMovement = require('../models/stockMovement');
const Supplier = require('../models/supplier');
const User = require('../models/user');
const { registerAuditLog } = require('../services/auditService');

function toNumber(value) {
  if (value === undefined || value === null || value === '') return 0;

  if (typeof value === 'string') {
    return Number(value.replace(/\./g, '').replace(',', '.'));
  }

  return Number(value);
}

async function getPurchaseWithItems(id) {
  return Purchase.findByPk(id, {
    include: [
      {
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name', 'tradeName', 'document'],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: PurchaseItem,
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

async function getAllPurchases(req, res) {
  try {
    const purchases = await Purchase.findAll({
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'tradeName', 'document'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: PurchaseItem,
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
      data: purchases,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar compras.',
      error: error.message,
    });
  }
}

async function getPurchaseStats(req, res) {
  try {
    const total = await Purchase.count();
    const confirmadas = await Purchase.count({ where: { status: 'confirmada' } });
    const rascunhos = await Purchase.count({ where: { status: 'rascunho' } });
    const canceladas = await Purchase.count({ where: { status: 'cancelada' } });

    const pendentesAprovacao = await Purchase.count({
      where: {
        approvalStatus: 'pendente',
      },
    });

    const aprovadas = await Purchase.count({
      where: {
        approvalStatus: 'aprovado',
      },
    });

    const reprovadas = await Purchase.count({
      where: {
        approvalStatus: 'reprovado',
      },
    });

    const totalComprado = await Purchase.sum('total', {
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
        totalComprado: Number(totalComprado || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar estatisticas de compras.',
      error: error.message,
    });
  }
}

async function validateProductsBelongToSupplier({ supplierId, items }) {
  if (!supplierId) {
    return {
      valid: false,
      message: 'Selecione um fornecedor para a compra.',
    };
  }

  if (!items || items.length === 0) {
    return {
      valid: false,
      message: 'Informe pelo menos um item para a compra.',
    };
  }

  const productIds = items.map((item) => item.productId).filter(Boolean);

  if (productIds.length !== items.length) {
    return {
      valid: false,
      message: 'Todos os itens da compra precisam ter um produto selecionado.',
    };
  }

  const products = await Product.findAll({
    where: {
      id: productIds,
    },
    attributes: ['id', 'name', 'sku', 'supplierId'],
  });

  if (products.length !== productIds.length) {
    return {
      valid: false,
      message: 'Um ou mais produtos da compra não foram encontrados.',
    };
  }

  const invalidProduct = products.find((product) => {
    return !product.supplierId || String(product.supplierId) !== String(supplierId);
  });

  if (invalidProduct) {
    return {
      valid: false,
      message: `O produto "${invalidProduct.name}" não pertence ao fornecedor selecionado.`,
    };
  }

  return {
    valid: true,
  };
}

async function createPurchase(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const {
      supplierId,
      number,
      issueDate,
      paymentStatus = 'pendente',
      discount = 0,
      freight = 0,
      notes,
      items,
    } = req.body;

    const validation = await validateProductsBelongToSupplier({
      supplierId,
      items,
    });

    if (!validation.valid) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    if (!supplierId) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Informe o fornecedor.',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Informe pelo menos um item da compra.',
      });
    }

    const supplier = await Supplier.findByPk(supplierId, { transaction });

    if (!supplier) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: 'Fornecedor nao encontrado.',
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
      const unitCost = toNumber(item.unitCost || product.costPrice);

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
        unitCost,
        total: quantity * unitCost,
      });
    }

    const subtotal = parsedItems.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - toNumber(discount) + toNumber(freight);
    const purchaseNumber = number || `COMP-${Date.now()}`;

    const purchase = await Purchase.create(
      {
        supplierId,
        userId: req.userId,
        number: purchaseNumber,
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
      await PurchaseItem.create(
        {
          purchaseId: purchase.id,
          productId: item.product.id,
          quantity: item.quantity,
          unitCost: item.unitCost,
          total: item.total,
        },
        { transaction }
      );
    }

    await registerAuditLog({
      entityType: 'purchase',
      entityId: purchase.id,
      action: 'purchase_created',
      description: `Compra ${purchase.number} criada como rascunho.`,
      userId: req.userId,
      metadata: {
        number: purchase.number,
        total: Number(purchase.total || 0),
        supplierId: purchase.supplierId,
        status: 'rascunho',
        approvalStatus: 'nao_enviado',
      },
      transaction,
    });

    await transaction.commit();

    const purchaseWithItems = await getPurchaseWithItems(purchase.id);

    return res.status(201).json({
      success: true,
      message: 'Compra criada como rascunho. Envie para aprovacao antes de confirmar.',
      data: purchaseWithItems,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      success: false,
      message: 'Erro ao criar compra.',
      error: error.message,
    });
  }
}

async function cancelPurchase(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const purchase = await Purchase.findByPk(req.params.id, {
      include: [
        {
          model: PurchaseItem,
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

    if (!purchase) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: 'Compra nao encontrada.',
      });
    }

    if (purchase.status === 'cancelada') {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Esta compra ja esta cancelada.',
      });
    }

    const wasConfirmed = purchase.status === 'confirmada';

    if (wasConfirmed) {
      if (!purchase.items || purchase.items.length === 0) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: 'Compra confirmada sem itens nao pode ser estornada automaticamente.',
        });
      }

      for (const item of purchase.items) {
        const product = item.product;
        const quantity = toNumber(item.quantity);

        if (!product) {
          await transaction.rollback();

          return res.status(404).json({
            success: false,
            message: 'Produto da compra nao encontrado.',
          });
        }

        if (product.trackStock && quantity > toNumber(product.currentStock)) {
          await transaction.rollback();

          return res.status(400).json({
            success: false,
            message: `Estoque insuficiente para estornar o produto ${product.name}.`,
          });
        }
      }

      for (const item of purchase.items) {
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
              unitCost: toNumber(item.unitCost),
              totalCost: toNumber(item.total),
              reason: 'Estorno de compra cancelada',
              reference: purchase.number,
              notes: `Saida gerada pelo cancelamento da compra ${purchase.number}`,
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
          notes: `Cancelado automaticamente pelo cancelamento da compra ${purchase.number}.`,
        },
        {
          where: {
            type: 'pagar',
            reference: purchase.number,
          },
          transaction,
        }
      );
    }

    await purchase.update(
      {
        status: 'cancelada',
      },
      { transaction }
    );

    await registerAuditLog({
      entityType: 'purchase',
      entityId: purchase.id,
      action: wasConfirmed ? 'purchase_reversed_cancelled' : 'purchase_cancelled',
      description: wasConfirmed
        ? `Compra ${purchase.number} cancelada com estorno de estoque e financeiro.`
        : `Compra ${purchase.number} cancelada.`,
      userId: req.userId,
      metadata: {
        number: purchase.number,
        total: Number(purchase.total || 0),
        wasConfirmed,
        status: 'cancelada',
      },
      transaction,
    });

    await transaction.commit();

    const updatedPurchase = await getPurchaseWithItems(purchase.id);

    return res.json({
      success: true,
      message: wasConfirmed
        ? 'Compra cancelada com estorno de estoque e financeiro.'
        : 'Compra cancelada com sucesso.',
      data: updatedPurchase,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      success: false,
      message: 'Erro ao cancelar compra.',
      error: error.message,
    });
  }
}

async function requestPurchaseApproval(req, res) {
  try {
    const purchase = await Purchase.findByPk(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Compra nao encontrada.',
      });
    }

    if (purchase.status !== 'rascunho') {
      return res.status(400).json({
        success: false,
        message: 'Somente compras em rascunho podem ser enviadas para aprovacao.',
      });
    }

    if (purchase.approvalStatus === 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Esta compra ja esta pendente de aprovacao.',
      });
    }

    await purchase.update({
      approvalStatus: 'pendente',
      requestedBy: req.userId,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    });
    await registerAuditLog({
  entityType: 'purchase',
  entityId: purchase.id,
  action: 'purchase_approval_requested',
  description: `Compra ${purchase.number} enviada para aprovacao.`,
  userId: req.userId,
  metadata: {
    number: purchase.number,
    total: Number(purchase.total || 0),
    approvalStatus: 'pendente',
  },
});

    return res.json({
      success: true,
      message: 'Compra enviada para aprovacao.',
      data: purchase,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar compra para aprovacao.',
      error: error.message,
    });
  }
}

async function approvePurchaseApproval(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const purchase = await Purchase.findByPk(req.params.id, {
      include: [
        {
          model: PurchaseItem,
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

    if (!purchase) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: 'Compra nao encontrada.',
      });
    }

    if (purchase.status === 'confirmada') {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Esta compra ja foi confirmada.',
      });
    }

    if (purchase.approvalStatus !== 'pendente') {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Somente compras pendentes podem ser aprovadas.',
      });
    }

    if (!purchase.items || purchase.items.length === 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Compra sem itens nao pode ser aprovada.',
      });
    }

    for (const item of purchase.items) {
      const product = item.product;

      if (product && product.trackStock) {
        const stockBefore = toNumber(product.currentStock);
        const stockAfter = stockBefore + toNumber(item.quantity);

        await StockMovement.create(
          {
            productId: product.id,
            userId: req.userId,
            type: 'entrada',
            quantity: toNumber(item.quantity),
            stockBefore,
            stockAfter,
            unitCost: toNumber(item.unitCost),
            totalCost: toNumber(item.total),
            reason: 'Compra aprovada',
            reference: purchase.number,
            notes: `Entrada gerada pela aprovacao da compra ${purchase.number}`,
          },
          { transaction }
        );

        await product.update(
          {
            currentStock: stockAfter,
            costPrice: toNumber(item.unitCost),
          },
          { transaction }
        );
      }
    }

    const existingFinancial = await FinancialEntry.findOne({
      where: {
        type: 'pagar',
        reference: purchase.number,
      },
      transaction,
    });

    if (!existingFinancial) {
      const costCenter = await CostCenter.findOne({
        where: {
          code: 'OPE-001',
        },
        transaction,
      });

      const accountPlan = await AccountPlan.findOne({
        where: {
          code: '2.01.001',
        },
        transaction,
      });

      await FinancialEntry.create(
        {
          type: 'pagar',
          description: `Compra ${purchase.number}`,
          supplierId: purchase.supplierId,
          costCenterId: costCenter?.id || null,
          accountPlanId: accountPlan?.id || null,
          userId: req.userId,
          reference: purchase.number,
          dueDate: purchase.issueDate,
          amount: toNumber(purchase.total),
          paidAmount: purchase.paymentStatus === 'pago' ? toNumber(purchase.total) : 0,
          status: purchase.paymentStatus === 'pago' ? 'pago' : 'aberto',
          paymentMethod: null,
          notes: `Lancamento gerado automaticamente pela aprovacao da compra ${purchase.number}.`,
        },
        { transaction }
      );
    }

    await purchase.update(
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
  entityType: 'purchase',
  entityId: purchase.id,
  action: 'purchase_approved',
  description: `Compra ${purchase.number} aprovada.`,
  userId: req.userId,
  metadata: {
    number: purchase.number,
    total: Number(purchase.total || 0),
    status: 'confirmada',
    approvalStatus: 'aprovado',
  },
  transaction,
});

    await transaction.commit();

    const updatedPurchase = await getPurchaseWithItems(purchase.id);


    return res.json({
      success: true,
      message: 'Compra aprovada, estoque atualizado e financeiro gerado com sucesso.',
      data: updatedPurchase,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      success: false,
      message: 'Erro ao aprovar compra.',
      error: error.message,
    });
  }
}

async function rejectPurchaseApproval(req, res) {
  try {
    const purchase = await Purchase.findByPk(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Compra nao encontrada.',
      });
    }

    if (purchase.approvalStatus !== 'pendente') {
      return res.status(400).json({
        success: false,
        message: 'Somente compras pendentes podem ser reprovadas.',
      });
    }

    await purchase.update({
      approvalStatus: 'reprovado',
      rejectedBy: req.userId,
      rejectedAt: new Date(),
      rejectionReason: req.body.reason || 'Compra reprovada.',
    });

await registerAuditLog({
  entityType: 'purchase',
  entityId: purchase.id,
  action: 'purchase_rejected',
  description: `Compra ${purchase.number} reprovada.`,
  userId: req.userId,
  metadata: {
    number: purchase.number,
    total: Number(purchase.total || 0),
    reason: req.body.reason || 'Compra reprovada.',
  },
});


    return res.json({
      success: true,
      message: 'Compra reprovada com sucesso.',
      data: purchase,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao reprovar compra.',
      error: error.message,
    });
  }
}

module.exports = {
  getAllPurchases,
  getPurchaseStats,
  createPurchase,
  cancelPurchase,
  requestPurchaseApproval,
  approvePurchaseApproval,
  rejectPurchaseApproval,
};