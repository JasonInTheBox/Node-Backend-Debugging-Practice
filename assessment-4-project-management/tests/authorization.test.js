const request = require('supertest');
const app = require('../src/app');
const db = require('../src/data/database');
const cache = require('../src/cache/cache');

const ALICE = 'user-1-token';
const CAROL = 'user-3-token'; // not a member of project 1
const ADMIN = 'admin-token';

beforeEach(() => {
  db.__reset();
  cache.clear();
});

describe('401 vs 403', () => {
  test('a missing Authorization header returns 401', async () => {
    const res = await request(app).get('/api/projects/1/tasks');
    expect(res.status).toBe(401);
  });

  test('an invalid bearer token returns 401', async () => {
    const res = await request(app)
      .get('/api/projects/1/tasks')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  test('a malformed Authorization header (no Bearer prefix) returns 401', async () => {
    const res = await request(app)
      .get('/api/projects/1/tasks')
      .set('Authorization', ADMIN);
    expect(res.status).toBe(401);
  });

  test('a genuine project non-member gets 403 while the owner succeeds', async () => {
    const nonMember = await request(app)
      .get('/api/projects/1/tasks')
      .set('Authorization', `Bearer ${CAROL}`);
    expect(nonMember.status).toBe(403);

    const owner = await request(app)
      .get('/api/projects/1/tasks')
      .set('Authorization', `Bearer ${ALICE}`);
    expect(owner.status).toBe(200);
  });
});

describe('admin bypass on admin-only routes', () => {
  test('a non-admin is rejected and an admin is allowed to delete a task', async () => {
    const asUser = await request(app).delete('/api/tasks/1').set('Authorization', `Bearer ${ALICE}`);
    expect(asUser.status).toBe(403);

    const asAdmin = await request(app).delete('/api/tasks/2').set('Authorization', `Bearer ${ADMIN}`);
    expect(asAdmin.status).toBe(204);
  });
});
