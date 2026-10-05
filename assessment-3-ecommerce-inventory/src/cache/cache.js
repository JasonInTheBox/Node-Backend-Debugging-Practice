/**
 * Minimal Redis-like in-memory cache built on a Map.
 */

const store = new Map();

function buildKey(prefix, params = {}) {
  const { category, inStock, minPrice, maxPrice, search, sort, order } = params;
  const relevant = { category, inStock, minPrice, maxPrice, search, sort, order };
  const suffix = Object.keys(relevant)
    .filter((k) => relevant[k] !== undefined)
    .sort()
    .map((k) => `${k}=${relevant[k]}`)
    .join('&');
  return suffix ? `${prefix}?${suffix}` : prefix;
}

function get(key) {
  return store.has(key) ? store.get(key) : undefined;
}

function set(key, value) {
  store.set(key, value);
}

function del(key) {
  store.delete(key);
}

function clear() {
  store.clear();
}

function invalidatePrefix(prefix) {
  for (const key of store.keys()) {
    if (key === prefix || key.startsWith(`${prefix}?`)) {
      store.delete(key);
    }
  }
}

module.exports = { buildKey, get, set, del, clear, invalidatePrefix };
