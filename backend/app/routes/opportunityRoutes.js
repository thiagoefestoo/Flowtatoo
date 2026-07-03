const express = require('express');

const opportunityController = require('../controllers/opportunityController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireViewer, opportunityController.getAll);
router.get('/:id', requireViewer, opportunityController.getById);
router.post('/', requireOperator, opportunityController.create);
router.post('/:id/send-approval', requireOperator, opportunityController.sendToApproval);
router.post('/:id/approve', requireManager, opportunityController.approve);
router.post('/:id/reject', requireManager, opportunityController.reject);
router.put('/:id', requireOperator, opportunityController.update);
router.delete('/:id', requireOperator, opportunityController.delete);

module.exports = router;
