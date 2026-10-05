const db = require('../data/database');

async function findAll() {
  return db.getAllUsers();
}

async function findById(id) {
  return db.getUserById(id);
}

async function findByEmail(email) {
  const all = await db.getAllUsers();
  return all.find((u) => u.email === email);
}

async function insert(data) {
  return db.insertUser(data);
}

async function updateById(id, data) {
  return db.updateUserById(id, data);
}

async function deleteById(id) {
  return db.deleteUserById(id);
}

module.exports = { findAll, findById, findByEmail, insert, updateById, deleteById };
