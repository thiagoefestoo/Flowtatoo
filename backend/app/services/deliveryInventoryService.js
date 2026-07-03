const Product = require('../models/product');
const DeliveryItem = require('../models/deliveryItem');
const StockMovement = require('../models/stockMovement');
const { registerAuditLog } = require('./auditService');

function toNumber(value) {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'string') return Number(value.replace(/\./g, '').replace(',', '.'));
  return Number(value);
}

function createInventoryError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.isInventoryError = true;
  return error;
}

function isInventorySchemaError(error) {
  const message = `${error?.message || ''} ${error?.parent?.message || ''} ${error?.original?.message || ''}`;

  return /relation .* does not exist|table .* does not exist|column .* does not exist|type .* does not exist|enum .* does not exist|does not exist/i.test(message)
    && /flow_delivery_items|stock_movements|products|current_stock|track_stock|stock_status|stock_movement_id|return_movement_id|stock_deducted_at|stock_returned_at|delivery_id|product_id|unit_cost|total_cost/i.test(message);
}

function buildInventorySetupResult(error) {
  return {
    applied: false,
    returned: false,
    items: [],
    skipped: true,
    setupMissing: true,
    warning: 'Módulo de estoque ainda não sincronizado no banco. A entrega foi enviada sem baixa automática. Rode DB_SYNC=true uma vez no backend.',
    error: error?.message,
  };
}

async function createStockMovementForProduct({ product, type, quantity, userId, reason, reference, notes, transaction }) {
  const parsedQuantity = toNumber(quantity);
  const stockBefore = toNumber(product.currentStock);
  let stockAfter = stockBefore;

  if (parsedQuantity <= 0) {
    throw createInventoryError('Quantidade de movimentação precisa ser maior que zero.');
  }

  if (type === 'saida') {
    if (parsedQuantity > stockBefore) {
      throw createInventoryError(`Estoque insuficiente para ${product.name}. Disponível: ${stockBefore}. Necessário: ${parsedQuantity}.`);
    }

    stockAfter = stockBefore - parsedQuantity;
  } else if (type === 'entrada') {
    stockAfter = stockBefore + parsedQuantity;
  } else {
    throw createInventoryError('Tipo de movimentação inválido para entrega.');
  }

  const unitCost = toNumber(product.costPrice);
  const movement = await StockMovement.create(
    {
      productId: product.id,
      userId,
      type,
      quantity: parsedQuantity,
      stockBefore,
      stockAfter,
      unitCost,
      totalCost: parsedQuantity * unitCost,
      reason,
      reference,
      notes,
    },
    { transaction }
  );

  await product.update({ currentStock: stockAfter }, { transaction });

  // Não registramos auditoria aqui dentro da mesma transação.
  // Em PostgreSQL, qualquer falha em auditoria dentro de uma transação aborta a transação inteira
  // e pode impedir o envio para a caixa do entregador. O próprio envio registra auditoria depois do commit.

  return movement;
}

async function applyStockOutForDelivery({ delivery, userId, transaction }) {
  let items = [];

  try {
    // IMPORTANTE: não usar include + FOR UPDATE aqui.
    // No PostgreSQL, Sequelize gera LEFT OUTER JOIN para o produto e o banco não permite
    // FOR UPDATE no lado anulável de um outer join, causando:
    // "FOR UPDATE cannot be applied to the nullable side of an outer join".
    // Primeiro travamos/lêmos os itens da entrega; depois buscamos cada produto separadamente.
    items = await DeliveryItem.findAll({
      where: { deliveryId: delivery.id },
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });
  } catch (error) {
    if (isInventorySchemaError(error)) {
      return buildInventorySetupResult(error);
    }
    throw error;
  }

  if (!items.length) {
    return { applied: false, items: [] };
  }

  const alreadyDeducted = items.filter((item) => item.stockStatus === 'baixado');
  if (alreadyDeducted.length === items.length) {
    return { applied: false, items };
  }

  try {
    for (const item of items) {
      if (item.stockStatus === 'baixado') continue;

      const product = item.product || await Product.findByPk(item.productId, { transaction, lock: transaction?.LOCK?.UPDATE });

      if (!product) {
        throw createInventoryError('Produto vinculado à entrega não foi encontrado.');
      }

      if (!product.trackStock) {
        continue;
      }

      const movement = await createStockMovementForProduct({
        product,
        type: 'saida',
        quantity: item.quantity,
        userId,
        reason: 'Saída por envio ao entregador',
        reference: delivery.orderNumber || delivery.document || delivery.id,
        notes: `Baixa automática da entrega ${delivery.title}.`,
        transaction,
      });

      await item.update(
        {
          status: 'baixado',
          stockStatus: 'baixado',
          stockMovementId: movement.id,
          stockDeductedAt: new Date(),
        },
        { transaction }
      );
    }
  } catch (error) {
    if (isInventorySchemaError(error)) {
      throw createInventoryError('Banco de dados do estoque não está sincronizado. Ative DB_SYNC=true no backend e reinicie a API uma vez.', 409);
    }
    throw error;
  }

  return { applied: true, items };
}

async function returnStockForDelivery({ delivery, userId, reason = 'Devolução por entrega não concluída', transaction }) {
  let items = [];

  try {
    // Mesma regra do envio: evitar include + FOR UPDATE para não gerar LEFT OUTER JOIN travado.
    items = await DeliveryItem.findAll({
      where: { deliveryId: delivery.id, stockStatus: 'baixado' },
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });
  } catch (error) {
    if (isInventorySchemaError(error)) {
      return buildInventorySetupResult(error);
    }
    throw error;
  }

  if (!items.length) {
    return { returned: false, items: [] };
  }

  try {
    for (const item of items) {
      const product = item.product || await Product.findByPk(item.productId, { transaction, lock: transaction?.LOCK?.UPDATE });

      if (!product || !product.trackStock) continue;

      const movement = await createStockMovementForProduct({
        product,
        type: 'entrada',
        quantity: item.quantity,
        userId,
        reason,
        reference: delivery.orderNumber || delivery.document || delivery.id,
        notes: `Retorno automático de item da entrega ${delivery.title}.`,
        transaction,
      });

      await item.update(
        {
          status: 'devolvido',
          stockStatus: 'devolvido',
          returnMovementId: movement.id,
          stockReturnedAt: new Date(),
        },
        { transaction }
      );
    }
  } catch (error) {
    if (isInventorySchemaError(error)) {
      throw createInventoryError('Banco de dados do estoque não está sincronizado. Ative DB_SYNC=true no backend e reinicie a API uma vez.', 409);
    }
    throw error;
  }

  return { returned: true, items };
}

module.exports = {
  applyStockOutForDelivery,
  returnStockForDelivery,
  isInventorySchemaError,
};
