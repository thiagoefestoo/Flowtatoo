const express = require('express');
const { requireAuth, requireViewer, requireOperator } = require('../middlewares/authMiddleware');
const controller = require('../controllers/tattooAppointmentController');

const router = express.Router();

router.use(requireAuth);
router.get('/', requireViewer, controller.getAll);
router.get('/:id', requireViewer, controller.getById);
router.post('/', requireOperator, controller.create);
router.put('/:id', requireOperator, controller.update);
router.patch('/:id/status', requireOperator, controller.updateStatus);
router.delete('/:id', requireOperator, controller.delete);

module.exports = router;
