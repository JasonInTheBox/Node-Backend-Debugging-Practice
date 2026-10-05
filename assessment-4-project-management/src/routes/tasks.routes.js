const express = require('express');
const controller = require('../controllers/tasks.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

const router = express.Router();

router.get('/:taskId', authenticate, controller.getTaskById);
router.get('/mine', authenticate, controller.getMyTasks);
router.get('/:taskId/comments', authenticate, controller.getTaskComments);
router.post('/:taskId/comments', authenticate, controller.createTaskComment);
router.patch('/:taskId', authenticate, controller.updateTask);
router.delete('/:taskId', authenticate, requireAdmin, controller.deleteTask);

module.exports = router;
