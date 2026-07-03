const express = require('express');

const purchaseController = require('../controllers/purchaseController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/stats', requireViewer, purchaseController.getPurchaseStats);
router.get('/', requireViewer, purchaseController.getAllPurchases);

router.post('/', requireOperator, purchaseController.createPurchase);

router.patch(
  '/:id/request-approval',
  requireOperator,
  purchaseController.requestPurchaseApproval
);

router.patch(
  '/:id/approve',
  requireManager,
  purchaseController.approvePurchaseApproval
);

router.patch(
  '/:id/reject-approval',
  requireManager,
  purchaseController.rejectPurchaseApproval
);

router.patch('/:id/cancel', requireOperator, purchaseController.cancelPurchase);

module.exports = router;