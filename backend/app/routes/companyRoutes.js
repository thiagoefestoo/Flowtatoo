const express = require('express');

const companyController = require('../controllers/companyController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/stats', requireViewer, companyController.getCompanyStats);
router.get('/', requireViewer, companyController.getAllCompanies);
router.get('/:id', requireViewer, companyController.getCompanyById);

router.post('/', requireManager, companyController.createCompany);
router.post('/:id/send-approval', requireOperator, companyController.sendToApproval);
router.post('/:id/approve', requireManager, companyController.approve);
router.post('/:id/reject', requireManager, companyController.reject);
router.put('/:id', requireManager, companyController.updateCompany);
router.delete('/:id', requireManager, companyController.deleteCompany);

module.exports = router;