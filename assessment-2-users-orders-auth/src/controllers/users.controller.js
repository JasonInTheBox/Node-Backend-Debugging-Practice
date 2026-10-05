const userService = require('../services/users.service');
const { validateUser } = require('../validation/users.validation');

async function getUsers(req, res, next) {
  try {
    const result = await userService.getAllUsers(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const user = await userService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const errors = validateUser(req.body);
    if (errors.length > 0) {
      res.status(400).json({ errors });
    }
    const created = await userService.createUser(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    const updated = await userService.updateUser(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    const success = await userService.deleteUser(id);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
