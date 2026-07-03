const express = require('express');

const controller = require('../controllers/hrBiController');
const { requireAuth, requireViewer } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/gerencial', requireViewer, controller.getManagerialBI);

module.exports = router;
