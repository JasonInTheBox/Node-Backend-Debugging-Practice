const projectsRepository = require('../repositories/projects.repository');
const usersRepository = require('../repositories/users.repository');

async function getUserProjects(user) {
  const all = await projectsRepository.findAll();
  if (user.role === 'admin') return all;
  return all.filter((p) => p.memberIds.includes(user.id));
}

async function isProjectOwner(project, userId) {
  return project.ownerId === userId;
}

async function userExists(userId) {
  const user = await usersRepository.findById(userId);
  return Boolean(user);
}

module.exports = { getUserProjects, isProjectOwner, userExists };
