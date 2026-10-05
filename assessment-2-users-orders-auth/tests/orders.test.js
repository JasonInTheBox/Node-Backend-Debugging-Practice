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

describe('GET /api/orders', () => {
  test('returns all seeded orders', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(6);
  });

  test('filters by status, including when combined with a small page size', async () => {
    const plain = await request(app).get('/api/orders?status=pending');
    expect(plain.status).toBe(200);
    expect(plain.body.data.every((o) => o.status === 'pending')).toBe(true);
    expect(plain.body.data).toHaveLength(2);

    cache.clear();

    const paged = await request(app).get('/api/orders?status=pending&limit=2');
    expect(paged.body.data.every((o) => o.status === 'pending')).toBe(true);
    expect(paged.body.data).toHaveLength(2);
  });

  test('sorts by quantity ascending and descending', async () => {
    const asc = await request(app).get('/api/orders?sort=quantity');
    const ascQuantities = asc.body.data.map((o) => o.quantity);
    expect(ascQuantities).toEqual([...ascQuantities].sort((a, b) => a - b));

    cache.clear();

    const desc = await request(app).get('/api/orders?sort=-quantity');
    const descQuantities = desc.body.data.map((o) => o.quantity);
    expect(descQuantities).toEqual([...descQuantities].sort((a, b) => b - a));
  });

  test('does not permanently reorder the underlying data when sorting', async () => {
    await request(app).get('/api/orders?sort=quantity');
    cache.clear();

    const res = await request(app).get('/api/orders');
    expect(res.body.data.map((o) => o.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('GET /api/orders/mine', () => {
  test('returns only the authenticated user\'s orders', async () => {
    const res = await request(app)
      .get('/api/orders/mine')
      .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((o) => o.userId === 2)).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('GET /api/orders/:id', () => {
  test('returns the correct order for each id, independently', async () => {
    const first = await request(app).get('/api/orders/1');
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ id: 1, product: 'Widget', quantity: 2 });

    const second = await request(app).get('/api/orders/3');
    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({ id: 3, product: 'Widget', quantity: 5 });
  });
});

describe('POST /api/orders', () => {
  test('creates a new order for an existing user', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`)
      .send({ userId: 2, product: 'Cable', quantity: 4 });
    expect(res.status).toBe(201);
    expect(res.body.product).toBe('Cable');
  });

  test('rejects a payload missing required fields', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`)
      .send({ userId: 2, quantity: 1 });
    expect(res.status).toBe(400);
  });

  test('rejects an order that references a nonexistent user', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`)
      .send({ userId: 9999, product: 'Ghost', quantity: 1 });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/orders/:id', () => {
  test('updates an order and the change is reflected on the next fetch', async () => {
    const putRes = await request(app)
      .put('/api/orders/2')
      .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`)
      .send({ quantity: 10 });
    expect(putRes.status).toBe(200);
    expect(putRes.body.quantity).toBe(10);

    const getRes = await request(app).get('/api/orders/2');
    expect(getRes.body.quantity).toBe(10);
  });

  test('reflects updates in the order list after the list cache has been warmed', async () => {
    await request(app).get('/api/orders');
    await request(app)
      .put('/api/orders/2')
      .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`)
      .send({ quantity: 99 });

    const res = await request(app).get('/api/orders');
    const updated = res.body.data.find((o) => o.id === 2);
    expect(updated.quantity).toBe(99);
  });
});

describe('DELETE /api/orders/:id', () => {
  test('reflects newly created orders after the list cache has been warmed', async () => {
    await request(app).get('/api/orders'); // warm the cache
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`)
      .send({ userId: 2, product: 'Webcam Stand', quantity: 1 });

    const res = await request(app).get('/api/orders');
    expect(res.body.data.some((o) => o.product === 'Webcam Stand')).toBe(true);
  });

  test('removes the order from subsequent reads, including cached ones', async () => {
    await request(app).get('/api/orders/1'); // warm the item cache
    await request(app).get('/api/orders'); // warm the list cache

    const deleteRes = await request(app)
      .delete('/api/orders/1')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await request(app).get('/api/orders/1');
    expect(getRes.status).toBe(404);

    const listRes = await request(app).get('/api/orders');
    expect(listRes.body.data.find((o) => o.id === 1)).toBeUndefined();
  });
});
