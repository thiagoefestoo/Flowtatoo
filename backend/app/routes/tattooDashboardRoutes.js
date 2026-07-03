const express = require('express');
const { requireAuth, requireViewer } = require('../middlewares/authMiddleware');
const controller = require('../controllers/tattooDashboardController');

const router = express.Router();

router.get('/public-summary', controller.publicSummary);
router.use(requireAuth);
router.get('/summary', requireViewer, controller.summary);
router.get('/bi', requireViewer, controller.bi);

module.exports = router;
