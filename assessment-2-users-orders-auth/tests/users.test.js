const request = require('supertest');
const app = require('../src/app');
const db = require('../src/data/database');
const cache = require('../src/cache/cache');

beforeEach(() => {
  db.__reset();
  cache.clear();
});

describe('GET /api/users', () => {
  test('returns all seeded users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
  });

  test('filters by role', async () => {
    const res = await request(app).get('/api/users?role=admin');
    expect(res.status).toBe(200);
    expect(res.body.data.every((u) => u.role === 'admin')).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  test('filters by active status', async () => {
    const res = await request(app).get('/api/users?active=false');
    expect(res.status).toBe(200);
    expect(res.body.data.every((u) => u.active === false)).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  test('paginates results correctly', async () => {
    const page1 = await request(app).get('/api/users?page=1&limit=2');
    expect(page1.body.data.map((u) => u.id)).toEqual([1, 2]);

    const page2 = await request(app).get('/api/users?page=2&limit=2');
    expect(page2.body.data.map((u) => u.id)).toEqual([3, 4]);
  });
});

describe('GET /api/users/:id', () => {
  test('returns the matching user for a valid id', async () => {
    const res = await request(app).get('/api/users/3');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 3, name: 'Carol Davis' });
  });

  test('returns 404 for a nonexistent id', async () => {
    const res = await request(app).get('/api/users/9999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/users', () => {
  test('creates a new customer', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Frank Ocean', email: 'frank@example.com', role: 'customer' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Frank Ocean');
    expect(res.body.role).toBe('customer');
  });

  test('rejects creation with a missing required field', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'noname@example.com', role: 'customer' });
    expect(res.status).toBe(400);
  });

  test('rejects creation of a duplicate email', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Duplicate Alice', email: 'alice@example.com', role: 'admin' });
    expect(res.status).toBe(409);
  });
});

describe('PUT /api/users/:id', () => {
  test('updates an existing user', async () => {
    const res = await request(app).put('/api/users/1').send({ name: 'Alice J.' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Alice J.');
  });
});

describe('DELETE /api/users/:id', () => {
  test('deletes an existing user and removes it from subsequent listings', async () => {
    const res = await request(app).delete('/api/users/4');
    expect(res.status).toBe(204);

    const listRes = await request(app).get('/api/users');
    expect(listRes.body.data.find((u) => u.id === 4)).toBeUndefined();
  });
});
