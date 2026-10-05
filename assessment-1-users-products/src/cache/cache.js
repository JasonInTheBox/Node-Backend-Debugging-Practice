/**
 * Minimal Redis-like in-memory cache built on a Map.
 */

const store = new Map();

function buildKey(prefix, params = {}) {
  return prefix;
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

module.exports = { buildKey, get, set, del, clear };
