const express = require('express');

const activityController = require('../controllers/activityController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireViewer, activityController.getAll);
router.get('/:id', requireViewer, activityController.getById);
router.post('/', requireOperator, activityController.create);
router.post('/:id/send-approval', requireOperator, activityController.sendToApproval);
router.post('/:id/approve', requireManager, activityController.approve);
router.post('/:id/reject', requireManager, activityController.reject);
router.put('/:id', requireOperator, activityController.update);
router.delete('/:id', requireOperator, activityController.delete);

module.exports = router;
