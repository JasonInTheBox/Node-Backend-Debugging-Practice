const express = require('express');
const controller = require('../controllers/projects.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { projectAccess } = require('../middleware/projectAccess.middleware');

const router = express.Router();

router.get('/', authenticate, controller.getProjects);
router.get('/:projectId', authenticate, projectAccess, controller.getProjectById);
router.get('/:projectId/tasks', authenticate, projectAccess, controller.getProjectTasks);
router.get('/:projectId/tasks/:taskId', authenticate, projectAccess, controller.getProjectTaskById);
router.post('/:projectId/tasks', authenticate, projectAccess, controller.createProjectTask);

module.exports = router;
