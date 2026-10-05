const request = require('supertest');
const app = require('../src/app');
const db = require('../src/data/database');
const cache = require('../src/cache/cache');

const USER_TOKEN = 'user-token';
const ADMIN_TOKEN = 'admin-token';

beforeEach(() => {
  db.__reset();
  cache.clear();
});

describe('401 vs 403 on protected endpoints', () => {
  test('a missing Authorization header returns 401', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ sku: 'X', name: 'X', category: 'accessory', price: 1, inventory: 1 });
    expect(res.status).toBe(401);
  });

  test('an invalid bearer token returns 401', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer totally-made-up-token')
      .send({ sku: 'X', name: 'X', category: 'accessory', price: 1, inventory: 1 });
    expect(res.status).toBe(401);
  });

  test('a malformed Authorization header (no Bearer prefix) returns 401', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', ADMIN_TOKEN)
      .send({ sku: 'X', name: 'X', category: 'accessory', price: 1, inventory: 1 });
    expect(res.status).toBe(401);
  });

  test('an authenticated non-admin gets 403, and an admin is let through', async () => {
    const asUser = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ sku: 'X', name: 'X', category: 'accessory', price: 1, inventory: 1 });
    expect(asUser.status).toBe(403);

    const asAdmin = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ sku: 'X', name: 'X', category: 'accessory', price: 1, inventory: 1 });
    expect(asAdmin.status).not.toBe(401);
    expect(asAdmin.status).not.toBe(403);
  });
});

describe('admin-only route enforcement', () => {
  test('deleting an order is allowed for an admin and forbidden for a non-admin', async () => {
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ productId: 5, quantity: 1 });

    const asAdmin = await request(app)
      .delete(`/api/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    expect(asAdmin.status).toBe(204);

    const asUser = await request(app)
      .delete('/api/orders/1')
      .set('Authorization', `Bearer ${USER_TOKEN}`);
    expect(asUser.status).toBe(403);
  });

  test('a non-admin cannot update a product', async () => {
    const res = await request(app)
      .patch('/api/products/2')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ price: 1 });
    expect(res.status).toBe(403);
  });
});
