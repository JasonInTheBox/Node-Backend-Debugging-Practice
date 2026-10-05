/**
 * In-memory "database" layer. Simulates an async data store (like a real
 * DB driver would return Promises) using a zero-delay timer.
 */

const initialProducts = [
  { id: 1, sku: 'SKU-KB-001', name: 'Mechanical Keyboard', category: 'keyboard', price: 79.99, inventory: 12 },
  { id: 2, sku: 'SKU-KB-002', name: 'Wireless Keyboard', category: 'keyboard', price: 49.99, inventory: 0 },
  { id: 3, sku: 'SKU-MS-001', name: 'Wireless Mouse', category: 'mouse', price: 25.99, inventory: 30 },
  { id: 4, sku: 'SKU-MN-001', name: '27-inch Monitor', category: 'monitor', price: 249.99, inventory: 5 },
  { id: 5, sku: 'SKU-MN-002', name: 'Ultrawide Monitor', category: 'monitor', price: 399.99, inventory: 2 },
  { id: 6, sku: 'SKU-AC-001', name: 'USB-C Hub', category: 'accessory', price: 19.99, inventory: 50 },
];

const initialOrders = [];

let products = initialProducts.map((p) => ({ ...p }));
let orders = initialOrders.map((o) => ({ ...o }));
let nextProductId = initialProducts.length + 1;
let nextOrderId = 1;

const delay = (fn) => new Promise((resolve) => setTimeout(() => resolve(fn()), 0));

module.exports = {
  // ---- products ----
  getAllProducts: () => delay(() => products.map((p) => ({ ...p }))),

  getProductById: (id) => delay(() => products.find((p) => p.id === id)),

  insertProduct: (data) => delay(() => {
    const product = { ...data, id: nextProductId++ };
    products.push(product);
    return product;
  }),

  updateProductById: (id, data) => delay(() => {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...data, id: products[idx].id };
    return products[idx];
  }),

  deleteProductById: (id) => delay(() => {
    const exists = products.some((p) => p.id === id);
    products = products.filter((p) => p.id !== id);
    return exists;
  }),

  // ---- orders ----
  getAllOrders: () => delay(() => orders.map((o) => ({ ...o }))),

  getOrderById: (id) => delay(() => orders.find((o) => o.id === id)),

  insertOrder: (data) => delay(() => {
    const order = { ...data, id: nextOrderId++ };
    orders.push(order);
    return order;
  }),

  deleteOrderById: (id) => delay(() => {
    const exists = orders.some((o) => o.id === id);
    orders = orders.filter((o) => o.id !== id);
    return exists;
  }),

  // ---- test utility ----
  __reset: () => {
    products = initialProducts.map((p) => ({ ...p }));
    orders = initialOrders.map((o) => ({ ...o }));
    nextProductId = initialProducts.length + 1;
    nextOrderId = 1;
  },
};
