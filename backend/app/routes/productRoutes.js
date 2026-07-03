const express = require('express');

const productController = require('../controllers/productController');
const {
requireAuth,
requireViewer,
requireOperator,
requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/stats', requireViewer, productController.getProductStats);
router.get('/', requireViewer, productController.getAllProducts);
router.get('/:id', requireViewer, productController.getProductById);

router.post('/', requireOperator, productController.createProduct);
router.put('/:id', requireOperator, productController.updateProduct);

router.patch(
'/:id/request-approval',
requireOperator,
productController.requestProductApproval
);

router.patch(
'/:id/approve',
requireManager,
productController.approveProductApproval
);

router.patch(
'/:id/reject-approval',
requireManager,
productController.rejectProductApproval
);

router.delete('/:id', requireOperator, productController.deleteProduct);

module.exports = router;
