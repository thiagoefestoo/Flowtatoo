const express = require('express');

const alertController = require('../controllers/alertController');
const {
  requireAuth,
  requireViewer,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/summary', requireViewer, alertController.getAlertsSummary);
router.get('/details', requireViewer, alertController.getAlertsDetails);

module.exports = router;