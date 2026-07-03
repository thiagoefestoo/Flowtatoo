const express = require('express');

const stockMovementController = require('../controllers/stockMovementController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/stats', requireViewer, stockMovementController.getStockStats);
router.get('/', requireViewer, stockMovementController.getAllStockMovements);

router.post('/', requireOperator, stockMovementController.createStockMovement);

module.exports = router;