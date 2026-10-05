const db = require('../data/database');

async function findAll() {
  return db.getAllProducts();
}

async function findById(id) {
  return db.getProductById(id);
}

async function insert(data) {
  return db.insertProduct(data);
}

async function updateById(id, data) {
  return db.updateProductById(id, data);
}

async function deleteById(id) {
  return db.deleteProductById(id);
}

module.exports = { findAll, findById, insert, updateById, deleteById };
