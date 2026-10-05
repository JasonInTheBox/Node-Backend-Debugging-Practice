const request = require('supertest');
const app = require('../src/app');
const db = require('../src/data/database');
const cache = require('../src/cache/cache');

const ALICE = 'user-1-token'; // owner + member of project 1
const BOB = 'user-2-token'; // member (not owner) of project 1; owner of project 2
const CAROL = 'user-3-token'; // member of project 2 only, not project 1
const ADMIN = 'admin-token';

beforeEach(() => {
  db.__reset();
  cache.clear();
});

describe('GET /api/projects', () => {
  test('lists only the caller\'s own projects, and all projects for an admin', async () => {
    const asBob = await request(app).get('/api/projects').set('Authorization', `Bearer ${BOB}`);
    expect(asBob.status).toBe(200);
    expect(asBob.body.data.every((p) => p.memberIds.includes(2))).toBe(true);
    expect(asBob.body.data).toHaveLength(2);

    const asAdmin = await request(app).get('/api/projects').set('Authorization', `Bearer ${ADMIN}`);
    expect(asAdmin.body.data).toHaveLength(2);
  });
});

describe('GET /api/projects/:projectId', () => {
  test('returns project details for the owner', async () => {
    const res = await request(app).get('/api/projects/1').set('Authorization', `Bearer ${ALICE}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Website Redesign');
  });

  test('returns project details for a non-owner member', async () => {
    const res = await request(app).get('/api/projects/1').set('Authorization', `Bearer ${BOB}`);
    expect(res.status).toBe(200);
  });

  test('rejects a non-member with 403, and an unauthenticated request with 401', async () => {
    const nonMember = await request(app).get('/api/projects/1').set('Authorization', `Bearer ${CAROL}`);
    expect(nonMember.status).toBe(403);

    const anonymous = await request(app).get('/api/projects/1');
    expect(anonymous.status).toBe(401);
  });

  test('returns 404 for a nonexistent project', async () => {
    const res = await request(app).get('/api/projects/9999').set('Authorization', `Bearer ${ADMIN}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/projects/:projectId/tasks', () => {
  test('lists tasks for a non-owner project member', async () => {
    const res = await request(app).get('/api/projects/1/tasks').set('Authorization', `Bearer ${BOB}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/projects/:projectId/tasks', () => {
  test('creates a task as the project owner', async () => {
    const res = await request(app)
      .post('/api/projects/1/tasks')
      .set('Authorization', `Bearer ${ALICE}`)
      .send({ title: 'New task', priority: 'medium', assigneeId: 1 });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New task');
  });

  test('rejects task creation by a non-owner member', async () => {
    const res = await request(app)
      .post('/api/projects/1/tasks')
      .set('Authorization', `Bearer ${BOB}`)
      .send({ title: 'New task', priority: 'medium', assigneeId: 2 });
    expect(res.status).toBe(403);
  });
});
