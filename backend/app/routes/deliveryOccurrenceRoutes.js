const express = require('express');

const deliveryOccurrenceController = require('../controllers/deliveryOccurrenceController');
const { requireAuth, requireViewer, requireOperator, requireRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', requireViewer, deliveryOccurrenceController.getAllOccurrences);
router.post('/', requireRoles('admin', 'gestor', 'operador', 'entregador'), deliveryOccurrenceController.createOccurrence);
router.put('/:id', requireOperator, deliveryOccurrenceController.updateOccurrence);
router.delete('/:id', requireOperator, deliveryOccurrenceController.deleteOccurrence);

module.exports = router;
