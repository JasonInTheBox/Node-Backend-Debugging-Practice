const ordersRepository = require('../repositories/orders.repository');
const productsRepository = require('../repositories/products.repository');
const cache = require('../cache/cache');

const LIST_CACHE_PREFIX = 'products:list';
async function getAllOrders() {
  return ordersRepository.findAll();
}

async function getOrderById(id) {
  return ordersRepository.findById(id);
}

async function getAvailableInventory(productId) {
  const product = await productsRepository.findById(productId);
  if (!product) {
    return null;
  }
  return product.inventory;
}

async function createOrder(payload) {
  const product = await productsRepository.findById(payload.productId);
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 400;
    throw err;
  }

  const available = await getAvailableInventory(payload.productId);
  if (available !== null && payload.quantity > available) {
    const err = new Error('Insufficient inventory');
    err.statusCode = 400;
    throw err;
  }

  const newInventory = product.inventory - payload.quantity;
  await productsRepository.updateById(product.id, { ...product, inventory: newInventory });

  cache.del(`products:${product.id}`);
  cache.invalidatePrefix(LIST_CACHE_PREFIX);

  const order = await ordersRepository.insert({
    productId: product.id,
    userId: payload.userId,
    quantity: payload.quantity,
    status: 'placed',
  });

  return order;
}

async function deleteOrder(id) {
  const order = await ordersRepository.findById(id);
  if (!order) return false;

  const product = await productsRepository.findById(order.productId);
  if (product) {
    await productsRepository.updateById(product.id, {
      ...product,
      inventory: product.inventory + order.quantity,
    });
    cache.del(`products:${product.id}`);
    cache.invalidatePrefix(LIST_CACHE_PREFIX);
  }

  await ordersRepository.deleteById(id);
  return true;
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  deleteOrder,
};
