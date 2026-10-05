const projectService = require('../services/projects.service');
const taskService = require('../services/tasks.service');
const { validateTaskCreate } = require('../validation/tasks.validation');

async function getProjects(req, res, next) {
  try {
    const projects = await projectService.getUserProjects(req.user);
    res.status(200).json({ data: projects });
  } catch (err) {
    next(err);
  }
}

async function getProjectById(req, res, next) {
  res.status(200).json(req.project);
}

async function getProjectTasks(req, res, next) {
  try {
    const projectId = Number(req.params.projectId);
    const result = await taskService.getProjectTasks(projectId, req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getProjectTaskById(req, res, next) {
  try {
    const projectId = Number(req.params.projectId);
    const taskId = Number(req.params.taskId);
    const task = await taskService.getTaskInProject(projectId, taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

async function createProjectTask(req, res, next) {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.projectId) {
      return res.status(403).json({ error: 'Only the project owner can create tasks' });
    }

    const errors = validateTaskCreate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const projectId = Number(req.params.projectId);
    const task = await taskService.createTask(projectId, req.body);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProjects,
  getProjectById,
  getProjectTasks,
  getProjectTaskById,
  createProjectTask,
};
