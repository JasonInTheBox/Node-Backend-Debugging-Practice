const request = require('supertest');
const app = require('../src/app');
const db = require('../src/data/database');
const cache = require('../src/cache/cache');

beforeEach(() => {
  db.__reset();
  cache.clear();
});

describe('GET /api/products', () => {
  test('returns all seeded products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(8);
  });

  test('filters by price range', async () => {
    const res = await request(app).get('/api/products?minPrice=40&maxPrice=100');
    expect(res.status).toBe(200);
    const prices = res.body.data.map((p) => p.price);
    expect(prices.every((p) => p >= 40 && p <= 100)).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  test('filters by active status for both true and false', async () => {
    const activeRes = await request(app).get('/api/products?active=true');
    expect(activeRes.body.data.every((p) => p.active === true)).toBe(true);

    const inactiveRes = await request(app).get('/api/products?active=false');
    expect(inactiveRes.body.data.every((p) => p.active === false)).toBe(true);
    expect(inactiveRes.body.data).toHaveLength(2);
  });

  test('sorts by price and by name', async () => {
    const asc = await request(app).get('/api/products?sort=price');
    const ascPrices = asc.body.data.map((p) => p.price);
    const sortedAsc = [...ascPrices].sort((a, b) => a - b);
    expect(ascPrices).toEqual(sortedAsc);

    const desc = await request(app).get('/api/products?sort=-price');
    const descPrices = desc.body.data.map((p) => p.price);
    const sortedDesc = [...descPrices].sort((a, b) => b - a);
    expect(descPrices).toEqual(sortedDesc);

    const byName = await request(app).get('/api/products?sort=name');
    const names = byName.body.data.map((p) => p.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sortedNames);
  });

  test('returns different results for different filters (cache correctness)', async () => {
    const electronics = await request(app).get('/api/products?category=electronics');
    const furniture = await request(app).get('/api/products?category=furniture');

    expect(electronics.body.data.every((p) => p.category === 'electronics')).toBe(true);
    expect(furniture.body.data.every((p) => p.category === 'furniture')).toBe(true);
    expect(electronics.body.data).not.toEqual(furniture.body.data);
  });

  test('reflects newly created products after the list cache has been warmed', async () => {
    await request(app).get('/api/products'); // warm the cache
    await request(app)
      .post('/api/products')
      .send({ name: 'Webcam', category: 'electronics', price: 59.99 });

    const res = await request(app).get('/api/products');
    expect(res.body.data.some((p) => p.name === 'Webcam')).toBe(true);
    expect(res.body.data).toHaveLength(9);
  });
});

describe('GET /api/products/:id', () => {
  test('returns the matching product for a valid id', async () => {
    const res = await request(app).get('/api/products/2');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 2, name: 'Mechanical Keyboard' });
  });

  test('returns 404 for a nonexistent id', async () => {
    const res = await request(app).get('/api/products/9999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/products', () => {
  test('creates a new product with valid data', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Monitor Stand', category: 'furniture', price: 29.99 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Monitor Stand');
    expect(res.body.id).toBeDefined();
  });

  test('rejects creation when required fields are missing', async () => {
    const res = await request(app).post('/api/products').send({ name: 'Nameless' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/products/:id', () => {
  test('updates price and reflects the change on subsequent fetch', async () => {
    const putRes = await request(app).put('/api/products/1').send({ price: 19.99 });
    expect(putRes.status).toBe(200);
    expect(putRes.body.price).toBe(19.99);

    const getRes = await request(app).get('/api/products/1');
    expect(getRes.body.price).toBe(19.99);
  });

  test('returns 404 when updating a nonexistent product', async () => {
    const res = await request(app).put('/api/products/9999').send({ price: 1 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/products/:id', () => {
  test('deletes an existing product and removes it from listings', async () => {
    const res = await request(app).delete('/api/products/5');
    expect(res.status).toBe(204);

    const getRes = await request(app).get('/api/products/5');
    expect(getRes.status).toBe(404);
  });

  test('returns 404 when deleting a nonexistent product', async () => {
    const res = await request(app).delete('/api/products/9999');
    expect(res.status).toBe(404);
  });
});
