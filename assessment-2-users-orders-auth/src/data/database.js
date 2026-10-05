/**
 * In-memory "database" layer. Simulates an async data store (like a real
 * DB driver would return Promises) using a zero-delay timer.
 */

const initialUsers = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', active: true },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'customer', active: true },
  { id: 3, name: 'Carol Davis', email: 'carol@example.com', role: 'customer', active: false },
  { id: 4, name: 'David Lee', email: 'david@example.com', role: 'customer', active: true },
  { id: 5, name: 'Eve Martinez', email: 'eve@example.com', role: 'admin', active: false },
];

const initialOrders = [
  { id: 1, userId: 1, product: 'Widget', quantity: 2, status: 'delivered' },
  { id: 2, userId: 2, product: 'Gadget', quantity: 1, status: 'pending' },
  { id: 3, userId: 2, product: 'Widget', quantity: 5, status: 'shipped' },
  { id: 4, userId: 3, product: 'Gizmo', quantity: 3, status: 'pending' },
  { id: 5, userId: 1, product: 'Gadget', quantity: 1, status: 'cancelled' },
  { id: 6, userId: 4, product: 'Widget', quantity: 2, status: 'delivered' },
];

let users = initialUsers.map((u) => ({ ...u }));
let orders = initialOrders.map((o) => ({ ...o }));
let nextUserId = initialUsers.length + 1;
let nextOrderId = initialOrders.length + 1;

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
    users = users.filter((u) => u.id !== id);
    return exists;
  }),

  // ---- orders ----
  // Note: unlike getAllUsers, this does not defensively copy each record's
  // container array before handing it back.
  getAllOrders: () => delay(() => orders),

  getOrderById: (id) => delay(() => orders.find((o) => o.id === id)),

  insertOrder: (data) => delay(() => {
    const order = { status: 'pending', ...data, id: nextOrderId++ };
    orders.push(order);
    return order;
  }),

  updateOrderById: (id, data) => delay(() => {
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    orders[idx] = { ...orders[idx], ...data, id: orders[idx].id };
    return orders[idx];
  }),

  deleteOrderById: (id) => delay(() => {
    const exists = orders.some((o) => o.id === id);
    orders = orders.filter((o) => o.id !== id);
    return exists;
  }),

  // ---- test utility ----
  __reset: () => {
    users = initialUsers.map((u) => ({ ...u }));
    orders = initialOrders.map((o) => ({ ...o }));
    nextUserId = initialUsers.length + 1;
    nextOrderId = initialOrders.length + 1;
  },
};
