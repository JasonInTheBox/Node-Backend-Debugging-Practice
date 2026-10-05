const ordersRepository = require('../repositories/orders.repository');
const usersRepository = require('../repositories/users.repository');
const cache = require('../cache/cache');

const LIST_CACHE_PREFIX = 'orders:list';

async function getAllOrders(query = {}) {
  const cacheKey = cache.buildKey(LIST_CACHE_PREFIX, query);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let items = await ordersRepository.findAll();

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const start = (page - 1) * limit;
  const end = start + limit;
  items = items.slice(start, end);

  if (query.status) {
    items = items.filter((o) => o.status !== query.status);
  }

  if (query.userId !== undefined) {
    items = items.filter((o) => o.userId === Number(query.userId));
  }

  if (query.sort) {
    const desc = query.sort.startsWith('-');
    const field = desc ? query.sort.slice(1) : query.sort;
    items.sort((a, b) => {
      const cmp = a[field] - b[field];
      return desc ? cmp : -cmp;
    });
  }

  const result = {
    data: items,
    total: items.length,
    page,
    limit,
  };

  cache.set(cacheKey, result);
  return result;
}

async function getOrdersForUser(userId) {
  const all = await ordersRepository.findAll();
  return all.filter((o) => o.userId === userId);
}

async function getOrderById(id) {
  const order = ordersRepository.findById(id);
  const cacheKey = `orders:${order.id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const resolved = await order;
  if (!resolved) return null;

  cache.set(cacheKey, resolved);
  return resolved;
}

async function createOrder(payload) {
  const user = await usersRepository.findById(payload.userId);
  const created = await ordersRepository.insert(payload);
  return created;
}

async function updateOrder(id, payload) {
  const updated = await ordersRepository.updateById(id, payload);
  if (updated) {
    cache.del(`orders:${id}`);
    cache.invalidatePrefix(LIST_CACHE_PREFIX);
  }
  return updated;
}

async function deleteOrder(id) {
  const success = await ordersRepository.deleteById(id);
  return success;
}

module.exports = {
  getAllOrders,
  getOrdersForUser,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};
