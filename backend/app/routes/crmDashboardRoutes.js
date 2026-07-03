const express = require('express');

const crmDashboardController = require('../controllers/crmDashboardController');
const { requireAuth, requireViewer } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/summary', requireViewer, crmDashboardController.getSummary);

module.exports = router;
