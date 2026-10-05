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
    expect(res.body.data[0]).toMatchObject({ name: 'Alice Johnson', email: 'alice@example.com' });
  });

  test('filters by active status', async () => {
    const activeRes = await request(app).get('/api/users?active=true');
    expect(activeRes.status).toBe(200);
    expect(activeRes.body.data.every((u) => u.active === true)).toBe(true);
    expect(activeRes.body.data).toHaveLength(3);

    const inactiveRes = await request(app).get('/api/users?active=false');
    expect(inactiveRes.status).toBe(200);
    expect(inactiveRes.body.data.every((u) => u.active === false)).toBe(true);
    expect(inactiveRes.body.data).toHaveLength(2);
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
    const res = await request(app).get('/api/users/2');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 2, name: 'Bob Smith' });
  });

  test('returns 404 for a nonexistent id', async () => {
    const res = await request(app).get('/api/users/9999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/users', () => {
  test('creates a new user with valid data', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Frank Ocean', email: 'frank@example.com', role: 'user' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Frank Ocean');
    expect(res.body.id).toBeDefined();
  });

  test('rejects creation when required fields are missing', async () => {
    const res = await request(app).post('/api/users').send({ name: 'No Email' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/users/:id', () => {
  test('updates an existing user', async () => {
    const res = await request(app).put('/api/users/1').send({ role: 'superadmin' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('superadmin');
    expect(res.body.id).toBe(1);
  });

  test('returns 404 when updating a nonexistent user', async () => {
    const res = await request(app).put('/api/users/9999').send({ role: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/users/:id', () => {
  test('deletes an existing user, returns 204, and removes it from subsequent listings', async () => {
    const res = await request(app).delete('/api/users/3');
    expect(res.status).toBe(204);

    const listRes = await request(app).get('/api/users');
    expect(listRes.body.data.find((u) => u.id === 3)).toBeUndefined();
    expect(listRes.body.data).toHaveLength(4);
  });

  test('returns 404 when deleting a nonexistent user', async () => {
    const res = await request(app).delete('/api/users/9999');
    expect(res.status).toBe(404);
  });
});
