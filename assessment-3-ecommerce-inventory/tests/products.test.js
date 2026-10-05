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

describe('GET /api/products', () => {
  test('supports category, inStock, price range, and search filters', async () => {
    const byCategory = await request(app).get('/api/products?category=keyboard');
    expect(byCategory.status).toBe(200);
    expect(byCategory.body.data.every((p) => p.category === 'keyboard')).toBe(true);
    expect(byCategory.body.data).toHaveLength(2);

    const inStockTrue = await request(app).get('/api/products?inStock=true');
    expect(inStockTrue.body.data.every((p) => p.inventory > 0)).toBe(true);

    const inStockFalse = await request(app).get('/api/products?inStock=false');
    expect(inStockFalse.body.data.every((p) => p.inventory === 0)).toBe(true);

    const byPrice = await request(app).get('/api/products?minPrice=25&maxPrice=100');
    expect(byPrice.body.data.every((p) => p.price >= 25 && p.price <= 100)).toBe(true);

    const bySearch = await request(app).get('/api/products?search=wireless');
    expect(bySearch.body.data.every((p) => p.name.toLowerCase().includes('wireless'))).toBe(true);
    expect(bySearch.body.data).toHaveLength(2);
  });

  test('paginates and sorts together', async () => {
    const res = await request(app).get('/api/products?sort=price&order=asc&page=1&limit=3');
    expect(res.status).toBe(200);
    const prices = res.body.data.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(res.body.data).toHaveLength(3);
  });
});

describe('GET /api/products/:id', () => {
  test('returns the matching product for a valid id', async () => {
    const res = await request(app).get('/api/products/3');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 3, name: 'Wireless Mouse' });
  });

  test('returns 404 for a nonexistent id', async () => {
    const res = await request(app).get('/api/products/9999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/products', () => {
  test('creates a product as admin, and rejects a product with zero inventory', async () => {
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ sku: 'SKU-NEW-001', name: 'Desk Mat', category: 'accessory', price: 14.99, inventory: 20 });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Desk Mat');

    const zeroInventory = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ sku: 'SKU-NEW-002', name: 'Mouse Pad', category: 'accessory', price: 9.99, inventory: 0 });
    expect(zeroInventory.status).toBe(201);
  });

  test('rejects a non-admin user', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ sku: 'SKU-X', name: 'X', category: 'accessory', price: 1, inventory: 1 });
    expect(res.status).toBe(403);
  });

  test('rejects an unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ sku: 'SKU-X', name: 'X', category: 'accessory', price: 1, inventory: 1 });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/products/:id', () => {
  test('preserves fields not included in the payload, and rejects non-admin callers', async () => {
    const patched = await request(app)
      .patch('/api/products/1')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ price: 89.99 });
    expect(patched.status).toBe(200);
    expect(patched.body.price).toBe(89.99);
    expect(patched.body.name).toBe('Mechanical Keyboard');
    expect(patched.body.category).toBe('keyboard');
    expect(patched.body.inventory).toBe(12);

    const rejected = await request(app)
      .patch('/api/products/2')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ price: 1 });
    expect(rejected.status).toBe(403);
  });
});

describe('DELETE /api/products/:id', () => {
  test('removes a product as admin, and rejects a non-admin caller', async () => {
    const deleted = await request(app)
      .delete('/api/products/6')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    expect(deleted.status).toBe(204);

    const rejected = await request(app)
      .delete('/api/products/1')
      .set('Authorization', `Bearer ${USER_TOKEN}`);
    expect(rejected.status).toBe(403);
  });
});
