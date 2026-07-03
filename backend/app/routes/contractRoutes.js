const express = require('express');

const contractController = require('../controllers/contractController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/stats', requireViewer, contractController.getContractStats);
router.get('/', requireViewer, contractController.getAllContracts);
router.get('/:id', requireViewer, contractController.getContractById);

router.post('/', requireOperator, contractController.createContract);
router.put('/:id', requireOperator, contractController.updateContract);

router.patch('/:id/request-approval', requireOperator, contractController.requestContractApproval);
router.patch('/:id/approve', requireManager, contractController.approveContractApproval);
router.patch('/:id/reject-approval', requireManager, contractController.rejectContractApproval);

router.delete('/:id', requireOperator, contractController.deleteContract);

module.exports = router;