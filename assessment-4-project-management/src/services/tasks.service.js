const tasksRepository = require('../repositories/tasks.repository');
const cache = require('../cache/cache');

function projectTasksCachePrefix(projectId) {
  return `tasks:project:${projectId}`;
}

function mineCacheKey(userId) {
  return `tasks:mine:${userId}`;
}

async function getProjectTasks(projectId, query = {}) {
  const prefix = projectTasksCachePrefix(projectId);
  const cacheKey = cache.buildKey(prefix, query);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let items = await tasksRepository.findByProjectId(projectId);

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const start = (page - 1) * limit;
  const end = start + limit;
  items = items.slice(start, end);

  if (query.completed !== undefined) {
    if (query.completed) {
      items = items.filter((t) => t.completed === true);
    }
  }

  if (query.priority) {
    items = items.filter((t) => t.priority === query.priority);
  }

  if (query.assigneeId !== undefined) {
    items = items.filter((t) => t.assigneeId === Number(query.assigneeId));
  }

  if (query.sort) {
    const order = query.order === 'desc' ? 'desc' : 'asc';
    items = [...items].sort((a, b) => {
      let cmp;
      if (a[query.sort] < b[query.sort]) cmp = -1;
      else if (a[query.sort] > b[query.sort]) cmp = 1;
      else cmp = 0;
      return order === 'desc' ? cmp : -cmp;
    });
  }

  const result = {
    data: items,
    total: items.length,
    page,
    limit,
  };

  cache.set(cacheKey, result);
  return result;
}

async function getTaskInProject(projectId, taskId) {
  const task = await tasksRepository.findById(taskId);
  if (!task) return null;
  return task;
}

async function getTasksForUser(userId) {
  return tasksRepository.findByAssigneeId(userId);
}

async function getTaskById(taskId) {
  return tasksRepository.findById(taskId);
}

async function createTask(projectId, payload) {
  const task = await tasksRepository.insert({
    projectId,
    title: payload.title,
    completed: false,
    priority: payload.priority,
    assigneeId: payload.assigneeId,
    createdAt: new Date().toISOString(),
  });

  cache.del(`tasks:${task.id}`);
  return task;
}

async function updateTask(id, payload) {
  const existing = await tasksRepository.findById(id);
  if (!existing) return null;

  const merged = {
    projectId: existing.projectId,
    createdAt: existing.createdAt,
    title: payload.title,
    completed: payload.completed,
    priority: payload.priority,
    assigneeId: payload.assigneeId,
  };

  await tasksRepository.updateById(id, merged);
}

async function deleteTask(id) {
  const existing = await tasksRepository.findById(id);
  if (!existing) return false;

  const success = await tasksRepository.deleteById(id);
  if (success) {
    cache.invalidatePrefix(projectTasksCachePrefix(existing.projectId));
    cache.del(mineCacheKey(existing.assigneeId));
  }
  return success;
}

module.exports = {
  getProjectTasks,
  getTaskInProject,
  getTasksForUser,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  projectTasksCachePrefix,
  mineCacheKey,
};
