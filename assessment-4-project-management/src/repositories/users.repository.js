const db = require('../data/database');

async function findById(id) {
  return db.getUserById(id);
}

async function findAll() {
  return db.getAllUsers();
}

module.exports = { findById, findAll };
