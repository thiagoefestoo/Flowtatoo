const express = require('express');

const userController = require('../controllers/userController');
const {
  requireAuth,
  requireAdmin,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/stats', userController.getUserStats);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;