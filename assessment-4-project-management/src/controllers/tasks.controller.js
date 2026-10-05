const taskService = require('../services/tasks.service');
const commentService = require('../services/comments.service');
const projectsRepository = require('../repositories/projects.repository');
const { validateTaskUpdate } = require('../validation/tasks.validation');
const { validateComment } = require('../validation/comments.validation');

async function assertTaskProjectMember(taskId, user) {
  const task = await taskService.getTaskById(taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.role === 'admin') return task;

  const project = await projectsRepository.findById(task.projectId);
  if (!project || !project.memberIds.includes(user.id)) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  return task;
}

async function getTaskById(req, res, next) {
  try {
    const id = Number(req.params.taskId);
    const task = await assertTaskProjectMember(id, req.user);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

async function getMyTasks(req, res, next) {
  try {
    const tasks = taskService.getTasksForUser(req.user.id);
    res.status(200).json({ data: tasks });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const id = Number(req.params.taskId);
    const existing = await taskService.getTaskById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user.role !== 'admin' && existing.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const errors = validateTaskUpdate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updated = await taskService.updateTask(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const id = Number(req.params.taskId);
    const success = await taskService.deleteTask(id);
    if (!success) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function getTaskComments(req, res, next) {
  try {
    const taskId = Number(req.params.taskId);
    await assertTaskProjectMember(taskId, req.user);
    const comments = commentService.getCommentsForTask(taskId);
    res.status(200).json({ data: comments });
  } catch (err) {
    next(err);
  }
}

async function createTaskComment(req, res, next) {
  try {
    const taskId = Number(req.params.taskId);
    await assertTaskProjectMember(taskId, req.user);

    const errors = validateComment(req.body);
    if (errors.length > 0) {
      res.status(400).json({ errors });
    }

    const comment = await commentService.createComment(taskId, req.user.id, req.body.message);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTaskById,
  getMyTasks,
  updateTask,
  deleteTask,
  getTaskComments,
  createTaskComment,
};
