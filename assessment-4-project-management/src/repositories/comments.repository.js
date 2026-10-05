const db = require('../data/database');

async function findByTaskId(taskId) {
  const all = await db.getAllComments();
  return all.filter((c) => c.taskId === taskId);
}

async function findById(id) {
  return db.getCommentById(id);
}

async function insert(data) {
  return db.insertComment(data);
}

async function deleteById(id) {
  return db.deleteCommentById(id);
}

module.exports = { findByTaskId, findById, insert, deleteById };
