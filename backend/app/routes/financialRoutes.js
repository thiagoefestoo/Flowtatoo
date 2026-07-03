const fs = require('fs');
const path = require('path');

const express = require('express');
const multer = require('multer');

const financialController = require('../controllers/financialController');
const {
  requireAuth,
  requireViewer,
  requireFinance,
} = require('../middlewares/authMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads/financial');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function destination(req, file, callback) {
    callback(null, uploadDir);
  },
  filename: function filename(req, file, callback) {
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
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: function fileFilter(req, file, callback) {
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error('Tipo de arquivo nao permitido.'));
    }

    return callback(null, true);
  },
});

router.use(requireAuth);

router.get('/stats', requireViewer, financialController.getFinancialStats);
router.get('/dre', requireAuth, financialController.getManagementDre);
router.get('/', requireViewer, financialController.getAllFinancialEntries);

router.get(
  '/:id/payment-proofs',
  requireViewer,
  financialController.getFinancialPaymentProofs
);

router.post('/', requireFinance, financialController.createFinancialEntry);
router.put('/:id', requireFinance, financialController.updateFinancialEntry);

router.patch(
  '/:id/pay',
  requireFinance,
  upload.single('paymentProof'),
  financialController.markFinancialEntryAsPaid
);

router.patch('/:id/cancel', requireFinance, financialController.cancelFinancialEntry);

module.exports = router;