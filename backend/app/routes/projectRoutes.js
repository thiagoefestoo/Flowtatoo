const express = require('express');

const projectController = require('../controllers/projectController');
const {
  requireAuth,
  requireViewer,
  requireOperator,
  requireManager,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/stats', requireViewer, projectController.getProjectStats);
router.get('/', requireViewer, projectController.getAllProjects);
router.get('/:id', requireViewer, projectController.getProjectById);

router.post('/', requireOperator, projectController.createProject);
router.put('/:id', requireOperator, projectController.updateProject);

router.patch('/:id/request-approval', requireOperator, projectController.requestProjectApproval);
router.patch('/:id/approve', requireManager, projectController.approveProjectApproval);
router.patch('/:id/reject-approval', requireManager, projectController.rejectProjectApproval);

router.delete('/:id', requireOperator, projectController.deleteProject);

module.exports = router;