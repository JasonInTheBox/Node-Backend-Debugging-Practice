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

describe('POST /api/orders', () => {
  test('creates an order, decreases inventory accordingly, and rejects orders exceeding stock', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ productId: 1, quantity: 2 });
    expect(res.status).toBe(201);

    const product = await request(app).get('/api/products/1');
    expect(product.body.inventory).toBe(10); // started at 12, minus 2

    const tooMany = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ productId: 3, quantity: 999 });
    expect(tooMany.status).toBe(400);
  });

  test('rejects a payload with an invalid productId', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ productId: 'not-a-number', quantity: 1 });
    expect(res.status).toBe(400);
  });

  test('rejects an unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ productId: 1, quantity: 1 });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/orders', () => {
  test('is admin-only: allows admin, rejects non-admin, rejects unauthenticated', async () => {
    const asAdmin = await request(app).get('/api/orders').set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    expect(asAdmin.status).toBe(200);
    expect(Array.isArray(asAdmin.body.data)).toBe(true);

    const asUser = await request(app).get('/api/orders').set('Authorization', `Bearer ${USER_TOKEN}`);
    expect(asUser.status).toBe(403);

    const anonymous = await request(app).get('/api/orders');
    expect(anonymous.status).toBe(401);
  });
});

describe('GET /api/orders/:id', () => {
  test('returns the matching order for an admin', async () => {
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ productId: 3, quantity: 1 });

    const res = await request(app)
      .get(`/api/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.productId).toBe(3);
  });
});

describe('DELETE /api/orders/:id', () => {
  test('removes the order and restores inventory as admin, and rejects a non-admin caller', async () => {
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ productId: 4, quantity: 2 });
    expect(created.status).toBe(201);

    const deleted = await request(app)
      .delete(`/api/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    expect(deleted.status).toBe(204);

    const product = await request(app).get('/api/products/4');
    expect(product.body.inventory).toBe(5); // restored back to the original amount

    const rejected = await request(app)
      .delete('/api/orders/1')
      .set('Authorization', `Bearer ${USER_TOKEN}`);
    expect(rejected.status).toBe(403);
  });
});
