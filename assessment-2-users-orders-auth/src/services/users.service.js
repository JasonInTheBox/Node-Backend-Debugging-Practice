const usersRepository = require('../repositories/users.repository');

async function getAllUsers(query = {}) {
  let users = await usersRepository.findAll();

  if (query.role) {
    users = users.filter((u) => u.role === query.role);
  }

  if (query.active !== undefined) {
    const wantActive = query.active === 'true';
    users = users.filter((u) => u.active === wantActive);
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: users.slice(start, end),
    total: users.length,
    page,
    limit,
  };
}

async function getUserById(id) {
  return usersRepository.findById(id);
}

async function createUser(payload) {
  const existing = await usersRepository.findByEmail(payload.email);
  if (existing) {
    const err = new Error('A user with this email already exists');
    err.statusCode = 409;
    throw err;
  }
  return usersRepository.insert(payload);
}

async function updateUser(id, payload) {
  return usersRepository.updateById(id, payload);
}

async function deleteUser(id) {
  return usersRepository.deleteById(id);
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
