const express = require('express');

const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/setup-admin', authController.setupAdmin);
router.post('/login', authController.login);

router.get('/me', requireAuth, authController.me);
router.put('/me', requireAuth, authController.updateMe);
router.patch('/change-password', requireAuth, authController.changePassword);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;