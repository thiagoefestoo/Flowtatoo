const express = require('express');

const accountPlanController = require('../controllers/accountPlanController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, accountPlanController.listAccountPlans);
router.get('/stats', requireAuth, accountPlanController.getAccountPlanStats);
router.get('/:id', requireAuth, accountPlanController.getAccountPlanById);
router.post('/', requireAuth, accountPlanController.createAccountPlan);
router.put('/:id', requireAuth, accountPlanController.updateAccountPlan);
router.delete('/:id', requireAuth, accountPlanController.deleteAccountPlan);

module.exports = router;