const sequelize = require('../../config/db');
const Delivery = require('../models/delivery');
const DeliveryItem = require('../models/deliveryItem');
const Product = require('../models/product');
const Customer = require('../models/customer');
const { registerAuditLog } = require('../services/auditService');

function toNumber(value) {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'string') return Number(value.replace(/\./g, '').replace(',', '.'));
  return Number(value);
}

const itemInclude = [
  { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'category', 'unit', 'currentStock', 'minStock', 'trackStock', 'costPrice', 'salePrice'] },
];

async function getDeliveryItems(req, res) {
  try {
    const delivery = await Delivery.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'tradeName'] },
        { model: DeliveryItem, as: 'items', include: itemInclude },
      ],
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Entrega não encontrada.' });
    }

    return res.json({ success: true, data: { delivery, items: delivery.items || [] } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar itens da entrega.', error: error.message });
  }
}

async function replaceDeliveryItems(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Envie a lista de itens da entrega.' });
    }

    const delivery = await Delivery.findByPk(req.params.id, { transaction });

    if (!delivery) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Entrega não encontrada.' });
    }

    if (['entregue', 'cancelada'].includes(delivery.status)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Não é possível alterar itens de entrega concluída ou cancelada.' });
    }

    const currentItems = await DeliveryItem.findAll({ where: { deliveryId: delivery.id }, transaction });
    const hasDeductedStock = currentItems.some((item) => item.stockStatus === 'baixado');

    if (hasDeductedStock) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Esta entrega já teve baixa de estoque. Para alterar os itens, devolva/cancele a entrega antes.' });
    }

    const cleanItems = items
      .map((item) => ({
        productId: item.productId,
        quantity: toNumber(item.quantity),
        unitPrice: toNumber(item.unitPrice),
        notes: item.notes || null,
      }))
      .filter((item) => item.productId && item.quantity > 0);

    await DeliveryItem.destroy({ where: { deliveryId: delivery.id }, transaction });

    const createdItems = [];

    for (const item of cleanItems) {
      const product = await Product.findByPk(item.productId, { transaction });

      if (!product) {
        throw new Error('Produto selecionado não foi encontrado.');
      }

      if (product.status !== 'ativo') {
        throw new Error(`Produto ${product.name} não está ativo.`);
      }

      const unitCost = toNumber(product.costPrice);
      const unitPrice = item.unitPrice || toNumber(product.salePrice);

      const created = await DeliveryItem.create(
        {
          deliveryId: delivery.id,
          productId: product.id,
          quantity: item.quantity,
          unit: product.unit || 'UN',
          unitCost,
          unitPrice,
          totalCost: item.quantity * unitCost,
          totalPrice: item.quantity * unitPrice,
          status: 'pendente',
          stockStatus: 'pendente',
          notes: item.notes,
        },
        { transaction }
      );

      createdItems.push(created);
    }

    await registerAuditLog({
      entityType: 'delivery',
      entityId: delivery.id,
      action: 'delivery_items_updated',
      description: `Itens da entrega ${delivery.title} atualizados.`,
      userId: req.userId,
      metadata: {
        deliveryId: delivery.id,
        deliveryTitle: delivery.title,
        items: createdItems.map((item) => ({ productId: item.productId, quantity: item.quantity, totalPrice: item.totalPrice })),
      },
      transaction,
    });

    await transaction.commit();

    const updatedItems = await DeliveryItem.findAll({ where: { deliveryId: delivery.id }, include: itemInclude, order: [['createdAt', 'ASC']] });

    return res.json({ success: true, message: 'Itens da entrega salvos com sucesso.', data: updatedItems });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: 'Erro ao salvar itens da entrega.', error: error.message });
  }
}

async function getDeliveryInventorySummary(req, res) {
  try {
    const deliveries = await Delivery.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'tradeName'] },
        { model: DeliveryItem, as: 'items', include: itemInclude },
      ],
      order: [['createdAt', 'DESC']],
      limit: 150,
    });

    const withItems = deliveries.filter((delivery) => (delivery.items || []).length > 0);
    const totalItems = withItems.reduce((sum, delivery) => sum + delivery.items.length, 0);
    const totalQuantity = withItems.reduce((sum, delivery) => sum + delivery.items.reduce((itemSum, item) => itemSum + toNumber(item.quantity), 0), 0);
    const stockDeducted = withItems.reduce((sum, delivery) => sum + delivery.items.filter((item) => item.stockStatus === 'baixado').length, 0);
    const pendingStock = withItems.reduce((sum, delivery) => sum + delivery.items.filter((item) => item.stockStatus === 'pendente').length, 0);

    return res.json({
      success: true,
      data: {
        totals: {
          deliveriesWithItems: withItems.length,
          totalItems,
          totalQuantity,
          stockDeducted,
          pendingStock,
        },
        deliveries: withItems,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao carregar resumo de itens entregues.', error: error.message });
  }
}

module.exports = {
  getDeliveryItems,
  replaceDeliveryItems,
  getDeliveryInventorySummary,
};
