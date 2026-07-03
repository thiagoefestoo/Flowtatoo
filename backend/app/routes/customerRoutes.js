const fs = require('fs');
const path = require('path');

const express = require('express');
const multer = require('multer');

const customerController = require('../controllers/customerController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads/customers');

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

router.get('/stats', requireViewer, customerController.getCustomerStats);
router.get('/', requireViewer, customerController.getAllCustomers);
router.get('/:id', requireViewer, customerController.getCustomerById);

router.post(
  '/',
  requireOperator,
  upload.array('documents', 10),
  customerController.createCustomer
);

router.post('/:id/send-approval', requireOperator, customerController.sendToApproval);
router.post('/:id/approve', requireManager, customerController.approve);
router.post('/:id/reject', requireManager, customerController.reject);

router.put('/:id', requireOperator, customerController.updateCustomer);
router.delete('/:id', requireOperator, customerController.deleteCustomer);

module.exports = router;