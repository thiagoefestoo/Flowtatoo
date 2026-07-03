const { Op } = require('sequelize');

const Company = require('../models/company');
const Customer = require('../models/customer');
const Supplier = require('../models/supplier');
const Product = require('../models/product');
const StockMovement = require('../models/stockMovement');
const Purchase = require('../models/purchase');
const Sale = require('../models/sale');
const FinancialEntry = require('../models/financialEntry');
const Contract = require('../models/contract');
const Project = require('../models/project');

function money(value) {
  return Number(value || 0);
}

async function getDashboardSummary(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [
      companies,
      customers,
      suppliers,
      products,
      productsForStock,
      purchases,
      sales,
      contracts,
      projects,
      stockValue,
      purchasedTotal,
      soldTotal,
      receivableOpen,
      payableOpen,
      receivedTotal,
      paidTotal,
      overdueEntries,
      monthlyContractRevenue,
      monthlyContractCost,
      projectBudget,
      projectSpent,
      recentStockMovements,
      recentPurchases,
      recentSales,
      recentProjects,
      
    ] = await Promise.all([
      Company.count(),
      Customer.count(),
      Supplier.count(),
      Product.count(),

Product.findAll({
  attributes: ['id', 'trackStock', 'currentStock', 'minStock', 'salePrice'],
}),

      Purchase.count(),
      Sale.count(),
      Contract.count(),
      Project.count(),

      Product.sum('salePrice'),
      Purchase.sum('total', { where: { status: 'confirmada' } }),
      Sale.sum('total', { where: { status: 'confirmada' } }),

      FinancialEntry.sum('amount', {
        where: {
          type: 'receber',
          status: { [Op.in]: ['aberto', 'vencido'] },
        },
      }),

      FinancialEntry.sum('amount', {
        where: {
          type: 'pagar',
          status: { [Op.in]: ['aberto', 'vencido'] },
        },
      }),

      FinancialEntry.sum('paidAmount', {
        where: {
          type: 'receber',
          status: 'pago',
        },
      }),

      FinancialEntry.sum('paidAmount', {
        where: {
          type: 'pagar',
          status: 'pago',
        },
      }),

      FinancialEntry.count({
        where: {
          status: { [Op.in]: ['aberto', 'vencido'] },
          dueDate: { [Op.lt]: today },
        },
      }),

      Contract.sum('monthlyValue', {
        where: {
          status: 'ativo',
          type: 'cliente',
        },
      }),

      Contract.sum('monthlyValue', {
        where: {
          status: 'ativo',
          type: 'fornecedor',
        },
      }),

      Project.sum('budget'),
      Project.sum('spentValue'),

      StockMovement.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
      }),

      Purchase.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
      }),

      Sale.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
      }),

      Project.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
      }),
    ]);

    const lowStock = productsForStock.filter((product) => {
  return (
    product.trackStock &&
    Number(product.currentStock || 0) <= Number(product.minStock || 0)
  );
}).length;

const calculatedStockValue = productsForStock.reduce((total, product) => {
  return total + Number(product.currentStock || 0) * Number(product.salePrice || 0);
}, 0);

    const receberAberto = money(receivableOpen);
    const pagarAberto = money(payableOpen);
    const recebido = money(receivedTotal);
    const pago = money(paidTotal);
    const receitaContratos = money(monthlyContractRevenue);
    const custoContratos = money(monthlyContractCost);
    const orcadoProjetos = money(projectBudget);
    const gastoProjetos = money(projectSpent);

    return res.json({
      success: true,
      data: {
        totals: {
          companies,
          customers,
          suppliers,
          products,
          purchases,
          sales,
          contracts,
          projects,
        },
        inventory: {
          products,
          productsForStock,
          stockValue: money(calculatedStockValue),
        },
        commercial: {
          purchasedTotal: money(purchasedTotal),
          soldTotal: money(soldTotal),
          grossResult: money(soldTotal) - money(purchasedTotal),
        },
        financial: {
          receivableOpen: receberAberto,
          payableOpen: pagarAberto,
          receivedTotal: recebido,
          paidTotal: pago,
          openBalance: receberAberto - pagarAberto,
          cashBalance: recebido - pago,
          overdueEntries,
        },
        contracts: {
          monthlyRevenue: receitaContratos,
          monthlyCost: custoContratos,
          monthlyBalance: receitaContratos - custoContratos,
        },
        projects: {
          budgetTotal: orcadoProjetos,
          spentTotal: gastoProjetos,
          balanceTotal: orcadoProjetos - gastoProjetos,
        },
        recent: {
          stockMovements: recentStockMovements,
          purchases: recentPurchases,
          sales: recentSales,
          projects: recentProjects,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar resumo do dashboard.',
      error: error.message,
    });
  }
}

module.exports = {
  getDashboardSummary,
};