const express = require('express');

const costCenterController = require('../controllers/costCenterController');
const {
  requireAuth,
  requireViewer,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/stats', requireViewer, costCenterController.getCostCenterStats);
router.get('/', requireViewer, costCenterController.getAllCostCenters);

router.post('/', requireManager, costCenterController.createCostCenter);
router.put('/:id', requireManager, costCenterController.updateCostCenter);
router.delete('/:id', requireManager, costCenterController.deleteCostCenter);

module.exports = router;