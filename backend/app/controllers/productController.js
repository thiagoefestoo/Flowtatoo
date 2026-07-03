const { Op } = require('sequelize');

const Product = require('../models/product');
const Supplier = require('../models/supplier');
const { registerAuditLog } = require('../services/auditService');

function normalizeNumber(value) {
if (value === undefined || value === null || value === '') {
return 0;
}

return Number(value);
}

function buildProductMetadata(product) {
return {
name: product.name,
sku: product.sku,
barcode: product.barcode,
type: product.type,
category: product.category,
unit: product.unit,
costPrice: Number(product.costPrice || 0),
salePrice: Number(product.salePrice || 0),
minStock: Number(product.minStock || 0),
currentStock: Number(product.currentStock || 0),
trackStock: product.trackStock,
status: product.status,
approvalStatus: product.approvalStatus,
supplierId: product.supplierId,
rejectionReason: product.rejectionReason,
};
}

async function getAllProducts(req, res) {
try {
const { q, type, status, category, supplierId, approvalStatus } = req.query;


const where = {};

if (q) {
  where[Op.or] = [
    { name: { [Op.iLike]: `%${q}%` } },
    { sku: { [Op.iLike]: `%${q}%` } },
    { barcode: { [Op.iLike]: `%${q}%` } },
    { category: { [Op.iLike]: `%${q}%` } },
  ];
}

if (type) where.type = type;
if (status) where.status = status;
if (category) where.category = category;
if (supplierId) where.supplierId = supplierId;
if (approvalStatus) where.approvalStatus = approvalStatus;

const products = await Product.findAll({
  where,
  include: [
    {
      model: Supplier,
      as: 'supplier',
      attributes: ['id', 'name', 'tradeName', 'document'],
    },
  ],
  order: [['createdAt', 'DESC']],
});

return res.json({
  success: true,
  data: products,
});


} catch (error) {
return res.status(500).json({
success: false,
message: 'Erro ao listar produtos.',
error: error.message,
});
}
}

async function getProductStats(req, res) {
try {
const products = await Product.findAll();


const total = products.length;
const ativos = products.filter((product) => product.status === 'ativo').length;
const inativos = products.filter((product) => product.status === 'inativo').length;
const produtos = products.filter((product) => product.type === 'produto').length;
const servicos = products.filter((product) => product.type === 'servico').length;
const pendentesAprovacao = products.filter((product) => product.approvalStatus === 'pendente').length;
const aprovados = products.filter((product) => product.approvalStatus === 'aprovado').length;
const reprovados = products.filter((product) => product.approvalStatus === 'reprovado').length;

const baixoEstoque = products.filter((product) => {
  if (!product.trackStock || product.status !== 'ativo') return false;

  const currentStock = Number(product.currentStock || 0);
  const minStock = Number(product.minStock || 0);

  return currentStock <= minStock;
}).length;

const valorEstoque = products.reduce((totalValue, product) => {
  if (!product.trackStock || product.status !== 'ativo') return totalValue;

  return totalValue + Number(product.currentStock || 0) * Number(product.costPrice || 0);
}, 0);

return res.json({
  success: true,
  data: {
    total,
    ativos,
    inativos,
    produtos,
    servicos,
    pendentesAprovacao,
    aprovados,
    reprovados,
    baixoEstoque,
    valorEstoque,
  },
});


} catch (error) {
return res.status(500).json({
success: false,
message: 'Erro ao gerar estatisticas de produtos.',
error: error.message,
});
}
}

async function getProductById(req, res) {
try {
const product = await Product.findByPk(req.params.id, {
include: [
{
model: Supplier,
as: 'supplier',
attributes: ['id', 'name', 'tradeName', 'document'],
},
],
});


if (!product) {
  return res.status(404).json({
    success: false,
    message: 'Produto nao encontrado.',
  });
}

return res.json({
  success: true,
  data: product,
});


} catch (error) {
return res.status(500).json({
success: false,
message: 'Erro ao buscar produto.',
error: error.message,
});
}
}

async function createProduct(req, res) {
try {
const { name, sku } = req.body;


if (!name) {
  return res.status(400).json({
    success: false,
    message: 'Informe o nome do produto ou servico.',
  });
}

if (sku) {
  const existingProduct = await Product.findOne({
    where: {
      sku: sku.trim(),
    },
  });

  if (existingProduct) {
    return res.status(409).json({
      success: false,
      message: 'Ja existe um produto com este SKU.',
    });
  }
}

const product = await Product.create({
  ...req.body,
  name: name.trim(),
  sku: sku ? sku.trim() : null,
  supplierId: req.body.supplierId || null,
  costPrice: normalizeNumber(req.body.costPrice),
  salePrice: normalizeNumber(req.body.salePrice),
  minStock: normalizeNumber(req.body.minStock),
  currentStock: normalizeNumber(req.body.currentStock),
  status: req.body.status || 'ativo',
  approvalStatus: req.body.approvalStatus || 'nao_enviado',
  requestedBy: null,
  approvedBy: null,
  approvedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  rejectionReason: null,
});

await registerAuditLog({
  entityType: 'product',
  entityId: product.id,
  action: 'product_created',
  description: `Produto ${product.name} criado para controle de estoque.`,
  userId: req.userId,
  metadata: buildProductMetadata(product),
});

return res.status(201).json({
  success: true,
  message: 'Produto criado com sucesso para controle de estoque.',
  data: product,
});


} catch (error) {
return res.status(500).json({
success: false,
message: 'Erro ao criar produto.',
error: error.message,
});
}
}

async function updateProduct(req, res) {
try {
const product = await Product.findByPk(req.params.id, {
include: [
{
model: Supplier,
as: 'supplier',
attributes: ['id', 'name', 'tradeName', 'document'],
},
],
});


if (!product) {
  return res.status(404).json({
    success: false,
    message: 'Produto nao encontrado.',
  });
}

const previousData = buildProductMetadata(product);

const { name, sku } = req.body;

if (!name) {
  return res.status(400).json({
    success: false,
    message: 'Informe o nome do produto ou servico.',
  });
}

if (sku) {
  const existingProduct = await Product.findOne({
    where: {
      sku: sku.trim(),
      id: {
        [Op.ne]: product.id,
      },
    },
  });

  if (existingProduct) {
    return res.status(409).json({
      success: false,
      message: 'Ja existe outro produto com este SKU.',
    });
  }
}

await product.update({
  ...req.body,
  name: name.trim(),
  sku: sku ? sku.trim() : null,
  supplierId: req.body.supplierId || null,
  costPrice: normalizeNumber(req.body.costPrice),
  salePrice: normalizeNumber(req.body.salePrice),
  minStock: normalizeNumber(req.body.minStock),
  currentStock: normalizeNumber(req.body.currentStock),
});

await registerAuditLog({
  entityType: 'product',
  entityId: product.id,
  action: 'product_updated',
  description: `Produto ${product.name} atualizado.`,
  userId: req.userId,
  metadata: {
    before: previousData,
    after: buildProductMetadata(product),
  },
});

return res.json({
  success: true,
  message: 'Produto atualizado com sucesso.',
  data: product,
});


} catch (error) {
return res.status(500).json({
success: false,
message: 'Erro ao atualizar produto.',
error: error.message,
});
}
}

async function requestProductApproval(req, res) {
try {
const product = await Product.findByPk(req.params.id);


if (!product) {
  return res.status(404).json({
    success: false,
    message: 'Produto nao encontrado.',
  });
}

if (product.status === 'ativo' && product.approvalStatus === 'aprovado') {
  return res.status(400).json({
    success: false,
    message: 'Este produto ja esta ativo e aprovado.',
  });
}

if (product.approvalStatus === 'pendente') {
  return res.status(400).json({
    success: false,
    message: 'Este produto ja esta pendente de aprovacao.',
  });
}

await product.update({
  status: 'inativo',
  approvalStatus: 'pendente',
  requestedBy: req.userId,
  approvedBy: null,
  approvedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  rejectionReason: null,
});

await registerAuditLog({
  entityType: 'product',
  entityId: product.id,
  action: 'product_approval_requested',
  description: `Produto ${product.name} enviado para aprovacao.`,
  userId: req.userId,
  metadata: buildProductMetadata(product),
});

return res.json({
  success: true,
  message: 'Produto enviado para aprovacao.',
  data: product,
});


} catch (error) {
return res.status(500).json({
success: false,
message: 'Erro ao enviar produto para aprovacao.',
error: error.message,
});
}
}

async function approveProductApproval(req, res) {
try {
const product = await Product.findByPk(req.params.id);


if (!product) {
  return res.status(404).json({
    success: false,
    message: 'Produto nao encontrado.',
  });
}

if (product.approvalStatus !== 'pendente') {
  return res.status(400).json({
    success: false,
    message: 'Somente produtos pendentes podem ser aprovados.',
  });
}

await product.update({
  status: 'ativo',
  approvalStatus: 'aprovado',
  approvedBy: req.userId,
  approvedAt: new Date(),
  rejectedBy: null,
  rejectedAt: null,
  rejectionReason: null,
});

await registerAuditLog({
  entityType: 'product',
  entityId: product.id,
  action: 'product_approved',
  description: `Produto ${product.name} aprovado e ativado.`,
  userId: req.userId,
  metadata: buildProductMetadata(product),
});

return res.json({
  success: true,
  message: 'Produto aprovado e ativado com sucesso.',
  data: product,
});


} catch (error) {
return res.status(500).json({
success: false,
message: 'Erro ao aprovar produto.',
error: error.message,
});
}
}

async function rejectProductApproval(req, res) {
try {
const product = await Product.findByPk(req.params.id);


if (!product) {
  return res.status(404).json({
    success: false,
    message: 'Produto nao encontrado.',
  });
}

if (product.approvalStatus !== 'pendente') {
  return res.status(400).json({
    success: false,
    message: 'Somente produtos pendentes podem ser reprovados.',
  });
}

const reason = req.body.reason || 'Produto reprovado.';

await product.update({
  status: 'inativo',
  approvalStatus: 'reprovado',
  rejectedBy: req.userId,
  rejectedAt: new Date(),
  rejectionReason: reason,
});

await registerAuditLog({
  entityType: 'product',
  entityId: product.id,
  action: 'product_rejected',
  description: `Produto ${product.name} reprovado.`,
  userId: req.userId,
  metadata: {
    ...buildProductMetadata(product),
    reason,
  },
});

return res.json({
  success: true,
  message: 'Produto reprovado com sucesso.',
  data: product,
});


} catch (error) {
return res.status(500).json({
success: false,
message: 'Erro ao reprovar produto.',
error: error.message,
});
}
}

async function deleteProduct(req, res) {
try {
const product = await Product.findByPk(req.params.id);


if (!product) {
  return res.status(404).json({
    success: false,
    message: 'Produto nao encontrado.',
  });
}

await product.update({
  status: 'inativo',
});

await registerAuditLog({
  entityType: 'product',
  entityId: product.id,
  action: 'product_inactivated',
  description: `Produto ${product.name} inativado.`,
  userId: req.userId,
  metadata: buildProductMetadata(product),
});

return res.json({
  success: true,
  message: 'Produto inativado com sucesso.',
  data: product,
});


} catch (error) {
return res.status(500).json({
success: false,
message: 'Erro ao inativar produto.',
error: error.message,
});
}
}

module.exports = {
getAllProducts,
getProductStats,
getProductById,
createProduct,
updateProduct,
requestProductApproval,
approveProductApproval,
rejectProductApproval,
deleteProduct,
};
