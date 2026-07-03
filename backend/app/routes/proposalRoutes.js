const express = require('express');

const proposalController = require('../controllers/proposalController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireViewer, proposalController.getAll);
router.get('/:id', requireViewer, proposalController.getById);
router.post('/', requireOperator, proposalController.create);
router.post('/:id/send-approval', requireOperator, proposalController.sendToApproval);
router.post('/:id/approve', requireManager, proposalController.approve);
router.post('/:id/reject', requireManager, proposalController.reject);
router.put('/:id', requireOperator, proposalController.update);
router.delete('/:id', requireOperator, proposalController.delete);

module.exports = router;
