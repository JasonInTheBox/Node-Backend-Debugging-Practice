const db = require('../data/database');

async function findByProjectId(projectId) {
  const all = await db.getAllTasks();
  return all.filter((t) => t.projectId === projectId);
}

async function findByAssigneeId(assigneeId) {
  const all = await db.getAllTasks();
  return all.filter((t) => t.assigneeId === assigneeId);
}

async function findById(id) {
  return db.getTaskById(id);
}

async function insert(data) {
  return db.insertTask(data);
}

async function updateById(id, data) {
  return db.updateTaskById(id, data);
}

async function deleteById(id) {
  return db.deleteTaskById(id);
}

module.exports = { findByProjectId, findByAssigneeId, findById, insert, updateById, deleteById };
