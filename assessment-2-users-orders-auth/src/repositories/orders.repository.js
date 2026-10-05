const db = require('../data/database');

async function findAll() {
  return db.getAllOrders();
}

async function findById(id) {
  return db.getOrderById(id);
}

async function insert(data) {
  return db.insertOrder(data);
}

async function updateById(id, data) {
  return db.updateOrderById(id, data);
}

async function deleteById(id) {
  return db.deleteOrderById(id);
}

module.exports = { findAll, findById, insert, updateById, deleteById };
