const request = require('supertest');
const app = require('../src/app');
const db = require('../src/data/database');
const cache = require('../src/cache/cache');

const CUSTOMER_TOKEN = 'customer-token-456';
const ADMIN_TOKEN = 'admin-token-123';

beforeEach(() => {
  db.__reset();
  cache.clear();
});

describe('order route authentication', () => {
  test('rejects order creation without an Authorization header', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ userId: 2, product: 'Cable', quantity: 1 });
    expect(res.status).toBe(401);
  });

  test('rejects order creation with an invalid bearer token', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({ userId: 2, product: 'Cable', quantity: 1 });
    expect(res.status).toBe(401);
  });

  test('allows order creation with a valid token', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`)
      .send({ userId: 2, product: 'Cable', quantity: 1 });
    expect(res.status).toBe(201);
  });

  test('rejects GET /api/orders/mine without authentication', async () => {
    const res = await request(app).get('/api/orders/mine');
    expect(res.status).toBe(401);
  });
});

describe('order route authorization', () => {
  test('returns 403 when a non-admin tries to delete an order', async () => {
    const res = await request(app)
      .delete('/api/orders/1')
      .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`);
    expect(res.status).toBe(403);
  });

  test('allows an admin to delete an order', async () => {
    const res = await request(app)
      .delete('/api/orders/1')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    expect(res.status).toBe(204);
  });
});

describe('public read access', () => {
  test('allows listing orders without authentication', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
  });
});
