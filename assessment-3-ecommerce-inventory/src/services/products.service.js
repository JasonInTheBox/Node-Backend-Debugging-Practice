const productsRepository = require('../repositories/products.repository');
const cache = require('../cache/cache');

const LIST_CACHE_PREFIX = 'products:list';

async function getAllProducts(query = {}) {
  const cacheKey = cache.buildKey(LIST_CACHE_PREFIX, query);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let items = await productsRepository.findAll();

  if (query.category) {
    items = items.filter((p) => p.category === query.category);
  }

  if (query.inStock !== undefined) {
    if (query.inStock) {
      items = items.filter((p) => p.inventory > 0);
    }
  }

  if (query.minPrice !== undefined) {
    items = items.filter((p) => p.price >= Number(query.minPrice));
  }

  if (query.maxPrice !== undefined) {
    items = items.filter((p) => p.price <= Number(query.maxPrice));
  }

  if (query.search) {
    const needle = query.search.toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(needle));
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const start = (page - 1) * limit;
  const end = start + limit;
  items = items.slice(start, end);

  if (query.sort) {
    const order = query.order === 'desc' ? 'desc' : 'asc';
    items = [...items].sort((a, b) => {
      const cmp = a[query.sort] - b[query.sort];
      return order === 'desc' ? cmp : -cmp;
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

async function getProductById(id) {
  const cacheKey = `products:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const product = await productsRepository.findById(id);
  if (product) cache.set(cacheKey, product);
  return product;
}

async function createProduct(payload) {
  const created = await productsRepository.insert(payload);
  cache.del(`products:${created.id}`);
  return created;
}

async function updateProduct(id, payload) {
  const existing = await productsRepository.findById(id);
  if (!existing) return null;

  const merged = {
    id: existing.id,
    sku: existing.sku,
    name: payload.name,
    category: payload.category,
    price: payload.price,
    inventory: payload.inventory,
  };

  const saved = await productsRepository.updateById(id, merged);
  cache.del(`products:${id}`);
  return saved;
}

async function deleteProduct(id) {
  const success = await productsRepository.deleteById(id);
  if (success) {
    cache.del(`products:${id}`);
    cache.invalidatePrefix(LIST_CACHE_PREFIX);
  }
  return success;
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  LIST_CACHE_PREFIX,
};
