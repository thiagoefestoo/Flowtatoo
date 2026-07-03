const express = require('express');

const saleController = require('../controllers/saleController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/stats', requireViewer, saleController.getSaleStats);
router.get('/', requireViewer, saleController.getAllSales);

router.post('/', requireOperator, saleController.createSale);

router.patch('/:id/request-approval', requireOperator, saleController.requestSaleApproval);
router.patch('/:id/approve', requireManager, saleController.approveSaleApproval);
router.patch('/:id/reject-approval', requireManager, saleController.rejectSaleApproval);
router.patch('/:id/cancel', requireOperator, saleController.cancelSale);

module.exports = router;