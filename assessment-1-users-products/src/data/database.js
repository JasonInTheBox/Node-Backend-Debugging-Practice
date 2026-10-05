/**
 * In-memory "database" layer. Simulates an async data store (like a real
 * DB driver would return Promises) using a zero-delay timer.
 */

const initialUsers = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', active: true },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', active: true },
  { id: 3, name: 'Carol Davis', email: 'carol@example.com', role: 'user', active: false },
  { id: 4, name: 'David Lee', email: 'david@example.com', role: 'user', active: true },
  { id: 5, name: 'Eve Martinez', email: 'eve@example.com', role: 'manager', active: false },
];

const initialProducts = [
  { id: 1, name: 'Wireless Mouse', category: 'electronics', price: 25.99, active: true },
  { id: 2, name: 'Mechanical Keyboard', category: 'electronics', price: 89.99, active: true },
  { id: 3, name: 'Standing Desk', category: 'furniture', price: 349.5, active: true },
  { id: 4, name: 'Office Chair', category: 'furniture', price: 199.0, active: false },
  { id: 5, name: 'USB-C Hub', category: 'electronics', price: 39.99, active: true },
  { id: 6, name: 'Desk Lamp', category: 'furniture', price: 45.0, active: true },
  { id: 7, name: 'Notebook Set', category: 'stationery', price: 12.5, active: true },
  { id: 8, name: 'Fountain Pen', category: 'stationery', price: 18.75, active: false },
];

let users = initialUsers.map((u) => ({ ...u }));
let products = initialProducts.map((p) => ({ ...p }));
let nextUserId = initialUsers.length + 1;
let nextProductId = initialProducts.length + 1;

const delay = (fn) => new Promise((resolve) => setTimeout(() => resolve(fn()), 0));

module.exports = {
  // ---- users ----
  getAllUsers: () => delay(() => users.map((u) => ({ ...u }))),

  getUserById: (id) => delay(() => users.find((u) => u.id === id)),

  insertUser: (data) => delay(() => {
    const user = { active: true, ...data, id: nextUserId++ };
    users.push(user);
    return user;
  }),

  updateUserById: (id, data) => delay(() => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...data, id: users[idx].id };
    return users[idx];
  }),

  deleteUserById: (id) => delay(() => {
    const exists = users.some((u) => u.id === id);
    users.filter((u) => u.id !== id);
    return exists;
  }),

  // ---- products ----
  getAllProducts: () => delay(() => products.map((p) => ({ ...p }))),

  getProductById: (id) => delay(() => products.find((p) => p.id === id)),

  insertProduct: (data) => delay(() => {
    const product = { active: true, ...data, id: nextProductId++ };
    products.push(product);
    return product;
  }),

  updateProductById: (id, data) => delay(() => {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...data, id: products[idx].id };
    return products[idx];
  }),

  deleteProductById: (id) => delay(() => {
    products = products.filter((p) => p.id !== id);
    return true;
  }),

  // ---- test utility ----
  __reset: () => {
    users = initialUsers.map((u) => ({ ...u }));
    products = initialProducts.map((p) => ({ ...p }));
    nextUserId = initialUsers.length + 1;
    nextProductId = initialProducts.length + 1;
  },
};
