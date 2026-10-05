const db = require('../data/database');
const cache = require('../cache/cache');

const LIST_CACHE_PREFIX = 'products:list';

function applyQuery(items, query) {
  let result = [...items];

  if (query.category) {
    result = result.filter((p) => p.category === query.category);
  }

  if (query.active !== undefined) {
    if (query.active) {
      result = result.filter((p) => p.active === Boolean(query.active));
    }
  }

  if (query.minPrice !== undefined) {
    result = result.filter((p) => p.price >= Number(query.minPrice));
  }

  if (query.maxPrice !== undefined) {
    result = result.filter((p) => p.price <= Number(query.maxPrice));
  }

  if (query.sort) {
    const desc = query.sort.startsWith('-');
    const field = desc ? query.sort.slice(1) : query.sort;

    result.sort((a, b) => {
      const cmp = String(a[field]).localeCompare(String(b[field]));
      return desc ? -cmp : cmp;
    });
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: result.slice(start, end),
    total: result.length,
    page,
    limit,
  };
}

async function getAllProducts(query = {}) {
  const cacheKey = cache.buildKey(LIST_CACHE_PREFIX, query);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const all = await db.getAllProducts();
  const result = applyQuery(all, query);
  cache.set(cacheKey, result);
  return result;
}

async function getProductById(id) {
  const cacheKey = `products:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const product = await db.getProductById(id);
  if (product) cache.set(cacheKey, product);
  return product;
}

async function createProduct(payload) {
  const created = await db.insertProduct(payload);
  cache.del(`products:${created.id}`);
  return created;
}

async function updateProduct(id, payload) {
  const updated = await db.updateProductById(id, payload);
  if (updated) {
    cache.del(`products:${id}`);
  }
  return updated;
}

async function deleteProduct(id) {
  const success = await db.deleteProductById(id);
  cache.del(`products:${id}`);
  return success;
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
