const express = require('express');

const auditLogController = require('../controllers/auditLogController');
const {
  requireAuth,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/stats', requireManager, auditLogController.getAuditLogStats);
router.get('/', requireManager, auditLogController.getAllAuditLogs);

module.exports = router;