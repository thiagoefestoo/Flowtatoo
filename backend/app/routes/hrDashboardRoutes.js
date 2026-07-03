const express = require('express');

const controller = require('../controllers/hrDashboardController');
const { requireAuth, requireViewer } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/public-summary', controller.getPublicSummary);
router.use(requireAuth);
router.get('/summary', requireViewer, controller.getSummary);

module.exports = router;
