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

describe('cache correctness across distinct requests', () => {
  test('repeated identical requests are consistent, and different filters do not share a cache entry', async () => {
    const first = await request(app).get('/api/products?category=keyboard');
    const second = await request(app).get('/api/products?category=keyboard');
    expect(second.body.data).toEqual(first.body.data);

    const monitors = await request(app).get('/api/products?category=monitor');
    expect(monitors.body.data.every((p) => p.category === 'monitor')).toBe(true);
    expect(monitors.body.data).not.toEqual(first.body.data);
  });

  test('different pages do not share a cache entry', async () => {
    const page1 = await request(app).get('/api/products?sort=id&page=1&limit=2');
    const page2 = await request(app).get('/api/products?sort=id&page=2&limit=2');
    expect(page1.body.data.map((p) => p.id)).not.toEqual(page2.body.data.map((p) => p.id));
  });
});

describe('cache invalidation on writes', () => {
  test('the product list reflects a new product and a price update after the cache has been warmed', async () => {
    await request(app).get('/api/products'); // warm the cache
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ sku: 'SKU-NEW-010', name: 'Webcam', category: 'accessory', price: 39.99, inventory: 15 });

    const afterCreate = await request(app).get('/api/products');
    expect(afterCreate.body.data.some((p) => p.name === 'Webcam')).toBe(true);

    await request(app).get('/api/products'); // warm the cache again
    await request(app)
      .patch('/api/products/3')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ price: 15.0 });

    const afterUpdate = await request(app).get('/api/products');
    const updated = afterUpdate.body.data.find((p) => p.id === 3);
    expect(updated.price).toBe(15.0);
  });

  test('the individual product endpoint reflects a PATCH update', async () => {
    await request(app).get('/api/products/1'); // warm the item cache
    await request(app)
      .patch('/api/products/1')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ price: 65.0 });

    const res = await request(app).get('/api/products/1');
    expect(res.body.price).toBe(65.0);
  });
});

describe('inventory changes invalidate product caches', () => {
  test('placing an order updates both the cached list and the cached product detail', async () => {
    await request(app).get('/api/products'); // warm the list cache
    await request(app).get('/api/products/6'); // warm the item cache

    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ productId: 6, quantity: 10 });

    const detail = await request(app).get('/api/products/6');
    expect(detail.body.inventory).toBe(40); // started at 50, minus 10

    const list = await request(app).get('/api/products');
    const listed = list.body.data.find((p) => p.id === 6);
    expect(listed.inventory).toBe(40);
  });
});
