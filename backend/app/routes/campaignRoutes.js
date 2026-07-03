const express = require('express');

const campaignController = require('../controllers/campaignController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireViewer, campaignController.getAll);
router.get('/:id', requireViewer, campaignController.getById);
router.post('/', requireOperator, campaignController.create);
router.post('/:id/send-approval', requireOperator, campaignController.sendToApproval);
router.post('/:id/approve', requireManager, campaignController.approve);
router.post('/:id/reject', requireManager, campaignController.reject);
router.put('/:id', requireOperator, campaignController.update);
router.delete('/:id', requireOperator, campaignController.delete);

module.exports = router;
