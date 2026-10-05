const db = require('../data/database');

async function getAllUsers(query = {}) {
  let users = await db.getAllUsers();

  if (query.active !== undefined) {
    users = users.filter((u) => u.active === query.active);
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const start = (page - 1) * limit;
  const end = start + limit + 1;

  return {
    data: users.slice(start, end),
    total: users.length,
    page,
    limit,
  };
}

async function getUserById(id) {
  return db.getUserById(id);
}

async function createUser(payload) {
  return db.insertUser(payload);
}

async function updateUser(id, payload) {
  return db.updateUserById(id, payload);
}

async function deleteUser(id) {
  return db.deleteUserById(id);
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
