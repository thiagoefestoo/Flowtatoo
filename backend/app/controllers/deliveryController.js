const { Op } = require('sequelize');
const sequelize = require('../../config/db');

const Delivery = require('../models/delivery');
const Customer = require('../models/customer');
const Company = require('../models/company');
const User = require('../models/user');
const Product = require('../models/product');
const DeliveryItem = require('../models/deliveryItem');
const { registerAuditLog } = require('../services/auditService');
const EntityDocument = require('../models/entityDocument');
const createApprovalHandlers = require('./crmApprovalHelper');
const { applyStockOutForDelivery, returnStockForDelivery, isInventorySchemaError } = require('../services/deliveryInventoryService');

const deliveryInclude = [
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'tradeName', 'phone', 'city', 'state'] },
  { model: Company, as: 'company', attributes: ['id', 'tradeName', 'corporateName'] },
  { model: User, as: 'driver', attributes: ['id', 'name', 'email', 'role'] },
  { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
  {
    model: DeliveryItem,
    as: 'items',
    include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'category', 'unit', 'currentStock', 'minStock', 'trackStock'] }],
  },
];

const deliveryCoreInclude = [
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'tradeName', 'phone', 'city', 'state'] },
  { model: Company, as: 'company', attributes: ['id', 'tradeName', 'corporateName'] },
  { model: User, as: 'driver', attributes: ['id', 'name', 'email', 'role'] },
  { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
];

function buildDeliveryMetadata(delivery) {
  return {
    orderNumber: delivery.orderNumber,
    title: delivery.title,
    document: delivery.document,
    customerId: delivery.customerId,
    driverId: delivery.driverId,
    recipientName: delivery.recipientName,
    recipientPhone: delivery.recipientPhone,
    address: delivery.address,
    number: delivery.number,
    district: delivery.district,
    city: delivery.city,
    state: delivery.state,
    scheduledDate: delivery.scheduledDate,
    priority: delivery.priority,
    status: delivery.status,
    approvalStatus: delivery.approvalStatus,
    deliveryFee: delivery.deliveryFee,
    itemsCount: Array.isArray(delivery.items) ? delivery.items.length : undefined,
  };
}

function validateRequired(data) {
  if (!data.title) return 'Informe o título da entrega.';
  if (!data.document) return 'Informe o documento da entrega.';
  if (!data.customerId) return 'Selecione o cliente da entrega.';
  if (!data.address) return 'Informe o endereço da entrega.';
  if (!data.city) return 'Informe a cidade da entrega.';
  if (!data.state) return 'Informe a UF da entrega.';
  if (!data.scheduledDate) return 'Informe a data prevista da entrega.';
  return null;
}


function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getEndOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function formatStatusLabel(status) {
  const labels = {
    pendente: 'pendente',
    enviada: 'enviada',
    recebida: 'recebida',
    em_rota: 'em rota',
    entregue: 'entregue',
    nao_entregue: 'não entregue',
    cancelada: 'cancelada',
  };

  return labels[status] || status || 'sem status';
}

function getDeliveryRouteLabel(delivery) {
  if (!delivery) return 'Sem entrega ativa no momento';

  const origin = delivery.customer?.city || delivery.customer?.name || 'Origem';
  const destination = [delivery.district, delivery.city].filter(Boolean).join(' / ') || 'Destino';

  return `${origin} → ${destination} • ${formatStatusLabel(delivery.status)}`;
}

function getOrderLabel(delivery) {
  if (!delivery) return 'Sem pedido ativo';
  return delivery.orderNumber ? `Pedido ${delivery.orderNumber}` : delivery.title || 'Pedido sem número';
}

async function buildLiveFlowSummary(baseWhere = {}) {
  const startOfToday = getStartOfToday();
  const endOfToday = getEndOfToday();

  const [
    total,
    pending,
    sent,
    received,
    inRoute,
    delivered,
    notDelivered,
    cancelled,
    sentToday,
    activeDrivers,
  ] = await Promise.all([
    Delivery.count({ where: baseWhere }),
    Delivery.count({ where: { ...baseWhere, status: 'pendente' } }),
    Delivery.count({ where: { ...baseWhere, status: 'enviada' } }),
    Delivery.count({ where: { ...baseWhere, status: 'recebida' } }),
    Delivery.count({ where: { ...baseWhere, status: 'em_rota' } }),
    Delivery.count({ where: { ...baseWhere, status: 'entregue' } }),
    Delivery.count({ where: { ...baseWhere, status: 'nao_entregue' } }),
    Delivery.count({ where: { ...baseWhere, status: 'cancelada' } }),
    Delivery.count({
      where: {
        ...baseWhere,
        status: { [Op.in]: ['enviada', 'recebida', 'em_rota', 'entregue'] },
        updatedAt: { [Op.between]: [startOfToday, endOfToday] },
      },
    }),
    Delivery.count({
      distinct: true,
      col: 'driverId',
      where: {
        ...baseWhere,
        status: 'em_rota',
        driverId: { [Op.ne]: null },
      },
    }),
  ]);

  const validTotal = Math.max(total - cancelled, 0);
  const completionRate = validTotal ? Number(((delivered / validTotal) * 100).toFixed(1)) : 0;

  const priorityDelivery = await Delivery.findOne({
    where: {
      ...baseWhere,
      status: { [Op.notIn]: ['entregue', 'cancelada'] },
      priority: { [Op.in]: ['urgente', 'alta'] },
    },
    include: deliveryInclude,
    order: [
      ['scheduledDate', 'ASC'],
      ['createdAt', 'DESC'],
    ],
  });

  const latestProof = await EntityDocument.findOne({
    where: {
      entityType: 'flow_delivery',
      documentType: 'comprovante_entrega',
    },
    order: [['createdAt', 'DESC']],
  });

  let proofDelivery = null;

  if (latestProof?.entityId) {
    proofDelivery = await Delivery.findByPk(latestProof.entityId, { include: deliveryInclude });
  }

  if (!proofDelivery) {
    proofDelivery = await Delivery.findOne({
      where: {
        ...baseWhere,
        status: 'entregue',
        proofCode: { [Op.ne]: null },
      },
      include: deliveryInclude,
      order: [['updatedAt', 'DESC']],
    });
  }

  return {
    updatedAt: new Date().toISOString(),
    steps: {
      received: pending,
      dispatched: sent + received,
      inRoute,
      confirmed: delivered,
    },
    stats: {
      total,
      sentToday,
      activeDrivers,
      completionRate,
      delivered,
      notDelivered,
      cancelled,
    },
    cards: {
      priority: priorityDelivery
        ? {
            label: 'Entrega priorizada',
            title: getOrderLabel(priorityDelivery),
            detail: getDeliveryRouteLabel(priorityDelivery),
            status: priorityDelivery.status,
          }
        : {
            label: 'Entrega priorizada',
            title: 'Nenhuma prioridade ativa',
            detail: 'Crie ou marque uma entrega como alta/urgente',
            status: 'pendente',
          },
      proof: proofDelivery
        ? {
            label: 'Comprovação',
            title: proofDelivery.proofCode ? `Evidência ${proofDelivery.proofCode}` : 'Evidência anexada',
            detail: latestProof?.originalName
              ? `${latestProof.originalName} • ${proofDelivery.city || 'entrega'}`
              : `Entrega confirmada • ${proofDelivery.city || 'operação'}`,
            status: proofDelivery.status,
          }
        : {
            label: 'Comprovação',
            title: 'Nenhuma evidência ainda',
            detail: 'Os comprovantes aparecem aqui após o envio',
            status: 'pendente',
          },
    },
  };
}

async function getPublicFlowSummary(req, res) {
  try {
    const data = await buildLiveFlowSummary();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao carregar painel público da operação.',
      error: error.message,
    });
  }
}

async function getAllDeliveries(req, res) {
  try {
    const { q, status, priority, approvalStatus, driverId, customerId } = req.query;
    const where = {};

    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { document: { [Op.iLike]: `%${q}%` } },
        { orderNumber: { [Op.iLike]: `%${q}%` } },
        { recipientName: { [Op.iLike]: `%${q}%` } },
        { address: { [Op.iLike]: `%${q}%` } },
        { city: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (driverId) where.driverId = driverId;
    if (customerId) where.customerId = customerId;

    if (req.user?.role === 'entregador') {
      where.driverId = req.userId;
    }

    const deliveries = await Delivery.findAll({
      where,
      include: deliveryInclude,
      order: [['scheduledDate', 'ASC'], ['createdAt', 'DESC']],
    });

    return res.json({ success: true, data: deliveries });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar entregas.', error: error.message });
  }
}

async function getDeliveryStats(req, res) {
  try {
    const baseWhere = req.user?.role === 'entregador' ? { driverId: req.userId } : {};
    const [total, pendentes, enviadas, recebidas, emRota, entregues, naoEntregues, aprovadas] = await Promise.all([
      Delivery.count({ where: baseWhere }),
      Delivery.count({ where: { ...baseWhere, status: 'pendente' } }),
      Delivery.count({ where: { ...baseWhere, status: 'enviada' } }),
      Delivery.count({ where: { ...baseWhere, status: 'recebida' } }),
      Delivery.count({ where: { ...baseWhere, status: 'em_rota' } }),
      Delivery.count({ where: { ...baseWhere, status: 'entregue' } }),
      Delivery.count({ where: { ...baseWhere, status: 'nao_entregue' } }),
      Delivery.count({ where: { ...baseWhere, approvalStatus: 'aprovado' } }),
    ]);

    return res.json({
      success: true,
      data: { total, pendentes, enviadas, recebidas, emRota, entregues, naoEntregues, aprovadas },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao gerar estatísticas de entregas.', error: error.message });
  }
}

async function getDashboardSummary(req, res) {
  try {
    const baseWhere = req.user?.role === 'entregador' ? { driverId: req.userId } : {};
    const deliveries = await Delivery.findAll({ where: baseWhere, include: deliveryInclude, order: [['scheduledDate', 'ASC']] });
    const now = new Date();

    const total = deliveries.length;
    const delivered = deliveries.filter((item) => item.status === 'entregue').length;
    const inRoute = deliveries.filter((item) => item.status === 'em_rota').length;
    const pendingApproval = deliveries.filter((item) => item.approvalStatus === 'pendente').length;
    const overdue = deliveries.filter((item) => new Date(item.scheduledDate) < now && !['entregue', 'cancelada'].includes(item.status)).length;
    const totalValue = deliveries.reduce((sum, item) => sum + Number(item.deliveryFee || 0), 0);
    const deliveredValue = deliveries.filter((item) => item.status === 'entregue').reduce((sum, item) => sum + Number(item.deliveryFee || 0), 0);
    const completionRate = total ? (delivered / total) * 100 : 0;
    const activeDrivers = new Set(deliveries.map((item) => item.driverId).filter(Boolean)).size;

    const liveFlow = await buildLiveFlowSummary(baseWhere);

    return res.json({
      success: true,
      data: {
        totals: {
          deliveries: total,
          delivered,
          inRoute,
          overdue,
          pendingApproval,
          activeDrivers,
        },
        financial: {
          totalValue,
          deliveredValue,
          completionRate,
        },
        recent: {
          deliveries: deliveries.slice(0, 8),
        },
        liveFlow,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao carregar dashboard operacional.', error: error.message });
  }
}

async function getDeliveryById(req, res) {
  try {
    const delivery = await Delivery.findByPk(req.params.id, { include: deliveryInclude });
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Entrega não encontrada.' });
    }
    if (req.user?.role === 'entregador' && delivery.driverId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Você não possui acesso a esta entrega.' });
    }
    return res.json({ success: true, data: delivery });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar entrega.', error: error.message });
  }
}

async function createDelivery(req, res) {
  try {
    const payload = { ...req.body };
    const validationError = validateRequired(payload);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const delivery = await Delivery.create(payload);

    await registerAuditLog({
      entityType: 'delivery',
      entityId: delivery.id,
      action: 'delivery_created',
      description: `Entrega ${delivery.title} criada.`,
      userId: req.userId,
      metadata: buildDeliveryMetadata(delivery),
    });

    const created = await Delivery.findByPk(delivery.id, { include: deliveryInclude });

    return res.status(201).json({ success: true, message: 'Entrega criada com sucesso.', data: created });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao criar entrega.', error: error.message });
  }
}

async function updateDelivery(req, res) {
  try {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Entrega não encontrada.' });
    }

    const payload = { ...req.body };
    const validationError = validateRequired({ ...delivery.toJSON(), ...payload });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const previous = buildDeliveryMetadata(delivery);
    await delivery.update(payload);

    await registerAuditLog({
      entityType: 'delivery',
      entityId: delivery.id,
      action: 'delivery_updated',
      description: `Entrega ${delivery.title} atualizada.`,
      userId: req.userId,
      metadata: { previous, current: buildDeliveryMetadata(delivery) },
    });

    const updated = await Delivery.findByPk(delivery.id, { include: deliveryInclude });
    return res.json({ success: true, message: 'Entrega atualizada com sucesso.', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao atualizar entrega.', error: error.message });
  }
}



async function safeRollback(transaction) {
  if (!transaction || transaction.finished) return;

  try {
    await transaction.rollback();
  } catch (rollbackError) {
    console.error('Falha ao desfazer transação de envio para entregador:', rollbackError);
  }
}

async function findDeliveryResponse(deliveryId) {
  try {
    return await Delivery.findByPk(deliveryId, { include: deliveryInclude });
  } catch (error) {
    console.warn('Não foi possível carregar entrega com itens de estoque. Retornando dados principais.', error.message);
    return await Delivery.findByPk(deliveryId, { include: deliveryCoreInclude });
  }
}

async function getInventoryReadiness() {
  const required = [
    { table: 'products', columns: ['id', 'current_stock', 'track_stock'] },
    { table: 'stock_movements', columns: ['id', 'product_id', 'type', 'quantity', 'stock_before', 'stock_after', 'unit_cost', 'total_cost'] },
    { table: 'flow_delivery_items', columns: ['id', 'delivery_id', 'product_id', 'quantity', 'stock_status', 'stock_movement_id', 'stock_deducted_at'] },
  ];

  try {
    const queryInterface = sequelize.getQueryInterface();

    for (const check of required) {
      const table = await queryInterface.describeTable(check.table);
      const missingColumns = check.columns.filter((column) => !table[column]);

      if (missingColumns.length) {
        return {
          ready: false,
          warning: 'Módulo de estoque ainda não sincronizado completamente. A entrega foi enviada sem baixa automática. Rode DB_SYNC=true uma vez no backend.',
          detail: `Tabela ${check.table} sem coluna(s): ${missingColumns.join(', ')}`,
        };
      }
    }

    return { ready: true, warning: null, detail: null };
  } catch (error) {
    return {
      ready: false,
      warning: 'Módulo de estoque ainda não sincronizado no banco. A entrega foi enviada sem baixa automática. Rode DB_SYNC=true uma vez no backend.',
      detail: error.message,
    };
  }
}

async function sendDeliveryToDriver(req, res) {
  let transaction = null;

  try {
    const { driverId, driverNotes } = req.body || {};

    if (!driverId) {
      return res.status(400).json({ success: false, message: 'Selecione um entregador para receber a entrega.' });
    }

    const inventoryReadiness = await getInventoryReadiness();

    transaction = await sequelize.transaction();

    const delivery = await Delivery.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK?.UPDATE,
    });

    if (!delivery) {
      await safeRollback(transaction);
      return res.status(404).json({ success: false, message: 'Entrega não encontrada.' });
    }

    if (['entregue', 'cancelada'].includes(delivery.status)) {
      await safeRollback(transaction);
      return res.status(400).json({
        success: false,
        message: 'Entregas concluídas ou canceladas não podem ser enviadas para a caixa do entregador.',
      });
    }

    const driver = await User.findOne({
      where: {
        id: driverId,
        role: 'entregador',
        status: 'ativo',
      },
      attributes: ['id', 'name', 'email', 'role', 'status'],
      transaction,
    });

    if (!driver) {
      await safeRollback(transaction);
      return res.status(404).json({
        success: false,
        message: 'Entregador ativo não encontrado para envio da entrega.',
      });
    }

    const previous = buildDeliveryMetadata(delivery);
    const note = driverNotes || `Entrega enviada para a caixa do entregador ${driver.name}.`;

    let inventoryResult = {
      applied: false,
      items: [],
      skipped: !inventoryReadiness.ready,
      setupMissing: !inventoryReadiness.ready,
      warning: inventoryReadiness.warning || null,
      setupDetail: inventoryReadiness.detail || null,
    };

    if (inventoryReadiness.ready) {
      try {
        inventoryResult = await applyStockOutForDelivery({
          delivery,
          userId: req.userId,
          transaction,
        });
      } catch (inventoryError) {
        await safeRollback(transaction);

        if (inventoryError.isInventoryError || inventoryError.statusCode === 400 || inventoryError.statusCode === 409) {
          return res.status(inventoryError.statusCode || 400).json({
            success: false,
            message: inventoryError.message,
            error: inventoryError.message,
          });
        }

        if (isInventorySchemaError(inventoryError)) {
          return res.status(409).json({
            success: false,
            message: 'Banco de dados ainda não sincronizado com o módulo de estoque. Ative DB_SYNC=true no backend e reinicie a API uma vez.',
            error: inventoryError.message,
          });
        }

        throw inventoryError;
      }
    }

    await delivery.update(
      {
        driverId: driver.id,
        status: 'enviada',
        driverNotes: note,
        deliveredAt: null,
      },
      { transaction }
    );

    const updated = await Delivery.findByPk(delivery.id, { transaction });

    await transaction.commit();
    transaction = null;

    const responseData = await findDeliveryResponse(delivery.id);
    const itemsCount = Array.isArray(inventoryResult.items) ? inventoryResult.items.length : 0;
    const baseMessage = itemsCount && inventoryResult.applied
      ? `Entrega enviada para ${driver.name} e estoque baixado automaticamente.`
      : `Entrega enviada para a caixa do entregador ${driver.name}.`;

    // Auditoria fora da transação principal. Se falhar, não bloqueia o envio.
    try {
      await registerAuditLog({
        entityType: 'delivery',
        entityId: delivery.id,
        action: 'delivery_sent_to_driver_box',
        description: `Entrega ${delivery.title} enviada para a caixa do entregador ${driver.name}.`,
        userId: req.userId,
        metadata: {
          previous,
          current: buildDeliveryMetadata(responseData || updated || delivery),
          driver: {
            id: driver.id,
            name: driver.name,
            email: driver.email,
          },
          inventory: {
            stockApplied: Boolean(inventoryResult.applied),
            itemsCount,
            skipped: Boolean(inventoryResult.skipped),
            setupMissing: Boolean(inventoryResult.setupMissing),
            warning: inventoryResult.warning || null,
            setupDetail: inventoryResult.setupDetail || null,
          },
          driverNotes: note,
        },
      });
    } catch (auditError) {
      console.error('Erro ao registrar auditoria do envio para entregador. Envio mantido:', auditError.message);
    }

    return res.json({
      success: true,
      message: inventoryResult.warning ? `${baseMessage} ${inventoryResult.warning}` : baseMessage,
      inventoryWarning: inventoryResult.warning || null,
      data: responseData || updated || delivery,
    });
  } catch (error) {
    await safeRollback(transaction);

    console.error('Erro em sendDeliveryToDriver:', {
      message: error.message,
      stack: error.stack,
      parent: error.parent?.message,
      original: error.original?.message,
    });

    const setupError = isInventorySchemaError(error);

    if (setupError) {
      return res.status(409).json({
        success: false,
        message: 'Banco de dados ainda não sincronizado com o módulo de estoque. Ative DB_SYNC=true no backend e reinicie a API uma vez.',
        error: error.message,
      });
    }

    if (error.isInventoryError || error.statusCode === 400 || error.statusCode === 409) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar entrega para a caixa do entregador.',
      error: error.message,
    });
  }
}


async function updateDeliveryStatus(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const { status, driverNotes } = req.body;
    const allowed = ['pendente', 'enviada', 'recebida', 'em_rota', 'entregue', 'nao_entregue', 'cancelada'];
    if (!allowed.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Status de entrega inválido.' });
    }

    const delivery = await Delivery.findByPk(req.params.id, { transaction, lock: transaction.LOCK?.UPDATE });
    if (!delivery) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Entrega não encontrada.' });
    }

    if (req.user?.role === 'entregador' && delivery.driverId !== req.userId) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Você só pode atualizar entregas atribuídas ao seu usuário.' });
    }

    const previous = buildDeliveryMetadata(delivery);
    const payload = { status };

    if (driverNotes !== undefined) {
      payload.driverNotes = driverNotes;
    }

    if (['recebida', 'em_rota', 'nao_entregue'].includes(status)) {
      payload.attempts = Number(delivery.attempts || 0) + (status === 'nao_entregue' ? 1 : 0);
    }

    if (status === 'entregue') {
      payload.deliveredAt = new Date();
      if (!payload.proofCode) {
        payload.proofCode = `FD-${Date.now().toString().slice(-6)}`;
      }
    }

    let stockReturn = null;
    if (['nao_entregue', 'cancelada'].includes(status)) {
      stockReturn = await returnStockForDelivery({
        delivery,
        userId: req.userId,
        reason: status === 'cancelada' ? 'Devolução por entrega cancelada' : 'Devolução por entrega não entregue',
        transaction,
      });
    }

    await delivery.update(payload, { transaction });

    await registerAuditLog({
      entityType: 'delivery',
      entityId: delivery.id,
      action: 'delivery_status_updated',
      description: `Status da entrega ${delivery.title} alterado para ${status}.`,
      userId: req.userId,
      metadata: {
        previous,
        current: buildDeliveryMetadata(delivery),
        driverNotes: delivery.driverNotes,
        inventory: stockReturn ? { returned: stockReturn.returned, itemsCount: stockReturn.items.length } : undefined,
      },
      transaction,
    });

    await transaction.commit();

    const updated = await Delivery.findByPk(delivery.id, { include: deliveryInclude });
    return res.json({
      success: true,
      message: stockReturn?.returned ? 'Status atualizado e estoque devolvido automaticamente.' : 'Status da entrega atualizado com sucesso.',
      data: updated,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: 'Erro ao atualizar status da entrega.', error: error.message });
  }
}


async function uploadDeliveryProof(req, res) {
  try {
    const delivery = await Delivery.findByPk(req.params.id, { include: deliveryInclude });

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Entrega não encontrada.' });
    }

    if (req.user?.role === 'entregador' && delivery.driverId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Você só pode enviar comprovante de entregas atribuídas ao seu usuário.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Envie um arquivo de comprovante.' });
    }

    const document = await EntityDocument.create({
      entityType: 'flow_delivery',
      entityId: delivery.id,
      documentType: req.body.documentType || 'comprovante_entrega',
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: `/uploads/delivery-proofs/${req.file.filename}`,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedBy: req.userId,
      notes: req.body.notes || 'Comprovante enviado pelo fluxo de entrega.',
    });

    const payload = {
      status: req.body.status || 'entregue',
      deliveredAt: delivery.deliveredAt || new Date(),
      proofCode: delivery.proofCode || `FD-${Date.now().toString().slice(-6)}`,
    };

    if (req.body.driverNotes !== undefined) {
      payload.driverNotes = req.body.driverNotes;
    }

    await delivery.update(payload);

    await registerAuditLog({
      entityType: 'delivery',
      entityId: delivery.id,
      action: 'delivery_proof_uploaded',
      description: `Comprovante anexado à entrega ${delivery.title}.`,
      userId: req.userId,
      metadata: {
        deliveryId: delivery.id,
        deliveryTitle: delivery.title,
        proofCode: delivery.proofCode,
        originalName: document.originalName,
        filePath: document.filePath,
        sizeBytes: document.sizeBytes,
        notes: document.notes,
      },
    });

    const updated = await Delivery.findByPk(delivery.id, { include: deliveryInclude });

    return res.status(201).json({
      success: true,
      message: 'Comprovante enviado e entrega atualizada com sucesso.',
      data: { delivery: updated, document },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao enviar comprovante da entrega.', error: error.message });
  }
}

async function getDeliveryProofs(req, res) {
  try {
    const documents = await EntityDocument.findAll({
      where: { entityType: 'flow_delivery', documentType: 'comprovante_entrega' },
      include: [{ model: User, as: 'uploadedByUser', attributes: ['id', 'name', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
    });

    const deliveryIds = [...new Set(documents.map((item) => item.entityId))];
    const deliveries = await Delivery.findAll({ where: { id: deliveryIds }, include: deliveryInclude });
    const deliveryMap = new Map(deliveries.map((item) => [item.id, item]));

    const data = documents
      .map((document) => ({
        ...document.toJSON(),
        delivery: deliveryMap.get(document.entityId) || null,
      }))
      .filter((item) => req.user?.role !== 'entregador' || item.delivery?.driverId === req.userId);

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar comprovantes.', error: error.message });
  }
}

async function deleteDelivery(req, res) {
  try {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Entrega não encontrada.' });
    }

    const metadata = buildDeliveryMetadata(delivery);
    await delivery.destroy();

    await registerAuditLog({
      entityType: 'delivery',
      entityId: req.params.id,
      action: 'delivery_deleted',
      description: `Entrega ${metadata.title || req.params.id} excluída.`,
      userId: req.userId,
      metadata,
    });

    return res.json({ success: true, message: 'Entrega excluída com sucesso.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao excluir entrega.', error: error.message });
  }
}

const approvalHandlers = createApprovalHandlers({
  model: Delivery,
  include: deliveryInclude,
  entityType: 'delivery',
  label: 'Entrega',
});

module.exports = {
  getPublicFlowSummary,
  getAllDeliveries,
  getDeliveryStats,
  getDashboardSummary,
  getDeliveryById,
  getDeliveryProofs,
  uploadDeliveryProof,
  createDelivery,
  updateDelivery,
  sendDeliveryToDriver,
  updateDeliveryStatus,
  deleteDelivery,
  ...approvalHandlers,
};
