const db = require('../data/database');

async function findAll() {
  return db.getAllProjects();
}

async function findById(id) {
  return db.getProjectById(id);
}

module.exports = { findAll, findById };
