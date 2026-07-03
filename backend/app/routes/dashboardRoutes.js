const express = require('express');

const dashboardController = require('../controllers/dashboardController');
const {
  requireAuth,
  requireViewer,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/summary', requireViewer, dashboardController.getDashboardSummary);

module.exports = router;