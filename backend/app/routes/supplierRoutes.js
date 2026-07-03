const express = require('express');

const supplierController = require('../controllers/supplierController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/stats', requireViewer, supplierController.getSupplierStats);
router.get('/', requireViewer, supplierController.getAllSuppliers);
router.get('/:id', requireViewer, supplierController.getSupplierById);

router.post('/', requireOperator, supplierController.createSupplier);
router.put('/:id', requireOperator, supplierController.updateSupplier);

router.patch(
  '/:id/request-approval',
  requireOperator,
  supplierController.requestSupplierApproval
);

router.patch(
  '/:id/approve',
  requireManager,
  supplierController.approveSupplierApproval
);

router.patch(
  '/:id/reject-approval',
  requireManager,
  supplierController.rejectSupplierApproval
);

router.delete('/:id', requireOperator, supplierController.deleteSupplier);

module.exports = router;