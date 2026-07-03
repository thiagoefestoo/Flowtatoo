const express = require('express');

const {
  requireAuth,
  requireViewer,
  requireOperator,
} = require('../middlewares/authMiddleware');

function createCrudRoutes(controller) {
  const router = express.Router();

  router.use(requireAuth);

  router.get('/', requireViewer, controller.getAll);
  router.get('/:id', requireViewer, controller.getById);
  router.post('/', requireOperator, controller.create);
  router.put('/:id', requireOperator, controller.update);
  router.delete('/:id', requireOperator, controller.delete);

  return router;
}

module.exports = createCrudRoutes;
