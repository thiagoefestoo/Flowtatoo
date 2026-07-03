const fs = require('fs');
const path = require('path');

const express = require('express');
const multer = require('multer');

const deliveryController = require('../controllers/deliveryController');
const deliveryItemController = require('../controllers/deliveryItemController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
  requireManager,
  requireRoles,
} = require('../middlewares/authMiddleware');

const router = express.Router();

const proofUploadDir = path.join(__dirname, '../../uploads/delivery-proofs');

if (!fs.existsSync(proofUploadDir)) {
  fs.mkdirSync(proofUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, proofUploadDir);
  },
  filename(req, file, callback) {
    const safeName = file.originalname
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.]/g, '-')
      .toLowerCase();

    callback(null, `${Date.now()}-${safeName}`);
  },
});

const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const uploadProof = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error('Tipo de arquivo não permitido para comprovante.'));
    }

    return callback(null, true);
  },
});

router.get('/public-flow-summary', deliveryController.getPublicFlowSummary);

router.use(requireAuth);

router.get('/stats', requireViewer, deliveryController.getDeliveryStats);
router.get('/dashboard-summary', requireViewer, deliveryController.getDashboardSummary);
router.get('/proofs', requireViewer, deliveryController.getDeliveryProofs);
router.get('/inventory-summary', requireViewer, deliveryItemController.getDeliveryInventorySummary);
router.get('/my-deliveries', requireRoles('admin', 'gestor', 'operador', 'entregador'), deliveryController.getAllDeliveries);
router.get('/', requireViewer, deliveryController.getAllDeliveries);
router.get('/:id/items', requireViewer, deliveryItemController.getDeliveryItems);
router.put('/:id/items', requireOperator, deliveryItemController.replaceDeliveryItems);
router.get('/:id', requireViewer, deliveryController.getDeliveryById);

router.post('/', requireOperator, deliveryController.createDelivery);
router.post('/:id/send-approval', requireOperator, deliveryController.sendToApproval);
router.post('/:id/send-to-driver', requireOperator, deliveryController.sendDeliveryToDriver);
router.post('/:id/approve', requireManager, deliveryController.approve);
router.post('/:id/reject', requireManager, deliveryController.reject);
router.post('/:id/status', requireRoles('admin', 'gestor', 'operador', 'entregador'), deliveryController.updateDeliveryStatus);
router.post('/:id/proof', requireRoles('admin', 'gestor', 'operador', 'entregador'), uploadProof.single('proof'), deliveryController.uploadDeliveryProof);
router.put('/:id', requireOperator, deliveryController.updateDelivery);
router.delete('/:id', requireOperator, deliveryController.deleteDelivery);

module.exports = router;
