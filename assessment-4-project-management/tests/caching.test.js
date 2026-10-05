const request = require('supertest');
const app = require('../src/app');
const db = require('../src/data/database');
const cache = require('../src/cache/cache');

const ADMIN = 'admin-token';

beforeEach(() => {
  db.__reset();
  cache.clear();
});

describe('cache isolation', () => {
  test("different projects' task lists do not share a cache entry", async () => {
    const project1 = await request(app).get('/api/projects/1/tasks').set('Authorization', `Bearer ${ADMIN}`);
    const project2 = await request(app).get('/api/projects/2/tasks').set('Authorization', `Bearer ${ADMIN}`);
    expect(project1.body.data.map((t) => t.id)).not.toEqual(project2.body.data.map((t) => t.id));
  });

  test('different filter combinations do not share a cache entry', async () => {
    const high = await request(app)
      .get('/api/projects/1/tasks?priority=high')
      .set('Authorization', `Bearer ${ADMIN}`);
    const low = await request(app)
      .get('/api/projects/1/tasks?priority=low')
      .set('Authorization', `Bearer ${ADMIN}`);
    expect(high.body.data).not.toEqual(low.body.data);
  });
});

describe('cache invalidation on writes', () => {
  test('the task list reflects a newly created task after the cache has been warmed', async () => {
    await request(app).get('/api/projects/1/tasks').set('Authorization', `Bearer ${ADMIN}`);
    await request(app)
      .post('/api/projects/1/tasks')
      .set('Authorization', `Bearer ${ADMIN}`)
      .send({ title: 'Fresh task', priority: 'low', assigneeId: 1 });

    const res = await request(app).get('/api/projects/1/tasks').set('Authorization', `Bearer ${ADMIN}`);
    expect(res.body.data.some((t) => t.title === 'Fresh task')).toBe(true);
  });

  test('the task list reflects a PATCH update after the cache has been warmed', async () => {
    await request(app).get('/api/projects/1/tasks').set('Authorization', `Bearer ${ADMIN}`);
    await request(app)
      .patch('/api/tasks/1')
      .set('Authorization', `Bearer ${ADMIN}`)
      .send({ completed: true });

    const res = await request(app).get('/api/projects/1/tasks').set('Authorization', `Bearer ${ADMIN}`);
    const updated = res.body.data.find((t) => t.id === 1);
    expect(updated.completed).toBe(true);
  });

  test('deleting a task removes it from the cached project task list', async () => {
    await request(app).get('/api/projects/1/tasks').set('Authorization', `Bearer ${ADMIN}`);
    await request(app).delete('/api/tasks/1').set('Authorization', `Bearer ${ADMIN}`);

    const res = await request(app).get('/api/projects/1/tasks').set('Authorization', `Bearer ${ADMIN}`);
    expect(res.body.data.some((t) => t.id === 1)).toBe(false);
  });
});
