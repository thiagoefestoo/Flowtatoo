const fs = require('fs');
const path = require('path');

const express = require('express');
const multer = require('multer');

const entityDocumentController = require('../controllers/entityDocumentController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads/entity-documents');

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
      .replace(/[̀-ͯ]/g, '')
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
  'text/plain',
  'text/csv',
];

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: function fileFilter(req, file, callback) {
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error('Tipo de arquivo não permitido.'));
    }

    return callback(null, true);
  },
});

router.use(requireAuth);

router.get('/:entityType/:entityId', requireViewer, entityDocumentController.getEntityDocuments);
router.post(
  '/:entityType/:entityId',
  requireOperator,
  upload.single('document'),
  entityDocumentController.createEntityDocument
);
router.delete('/:entityType/:id', requireManager, entityDocumentController.deleteEntityDocument);

module.exports = router;
