const request = require('supertest');
const app = require('../src/app');
const db = require('../src/data/database');
const cache = require('../src/cache/cache');

const ALICE = 'user-1-token'; // owner of project 1, assignee of tasks 1 & 3
const BOB = 'user-2-token'; // member of project 1, assignee of task 2; owner of project 2
const CAROL = 'user-3-token'; // member of project 2 only
const ADMIN = 'admin-token';

beforeEach(() => {
  db.__reset();
  cache.clear();
});

describe('GET /api/projects/:projectId/tasks filtering', () => {
  test('filters by completed=true and completed=false', async () => {
    const completedTrue = await request(app)
      .get('/api/projects/1/tasks?completed=true')
      .set('Authorization', `Bearer ${ADMIN}`);
    expect(completedTrue.body.data.every((t) => t.completed === true)).toBe(true);

    const completedFalse = await request(app)
      .get('/api/projects/1/tasks?completed=false')
      .set('Authorization', `Bearer ${ADMIN}`);
    expect(completedFalse.body.data.every((t) => t.completed === false)).toBe(true);
    expect(completedFalse.body.data).toHaveLength(2);
  });

  test('filters by priority and assigneeId', async () => {
    const byPriority = await request(app)
      .get('/api/projects/1/tasks?priority=high')
      .set('Authorization', `Bearer ${ADMIN}`);
    expect(byPriority.body.data.every((t) => t.priority === 'high')).toBe(true);

    const byAssignee = await request(app)
      .get('/api/projects/1/tasks?assigneeId=1')
      .set('Authorization', `Bearer ${ADMIN}`);
    expect(byAssignee.body.data.every((t) => t.assigneeId === 1)).toBe(true);
    expect(byAssignee.body.data).toHaveLength(2);
  });

  test('applies filters correctly even with a small page size', async () => {
    const res = await request(app)
      .get('/api/projects/1/tasks?priority=medium&limit=1')
      .set('Authorization', `Bearer ${ADMIN}`);
    expect(res.body.data.every((t) => t.priority === 'medium')).toBe(true);
    expect(res.body.total).toBe(1);
  });
});

describe('GET /api/projects/:projectId/tasks sorting', () => {
  test('sorts by priority ascending and descending', async () => {
    const asc = await request(app)
      .get('/api/projects/1/tasks?sort=priority&order=asc')
      .set('Authorization', `Bearer ${ADMIN}`);
    const ascValues = asc.body.data.map((t) => t.priority);
    expect(ascValues).toEqual([...ascValues].sort());

    const desc = await request(app)
      .get('/api/projects/1/tasks?sort=priority&order=desc')
      .set('Authorization', `Bearer ${ADMIN}`);
    const descValues = desc.body.data.map((t) => t.priority);
    expect(descValues).toEqual([...descValues].sort().reverse());
  });
});

describe('GET /api/projects/:projectId/tasks/:taskId', () => {
  test('returns a task that belongs to the requested project', async () => {
    const res = await request(app)
      .get('/api/projects/1/tasks/1')
      .set('Authorization', `Bearer ${ADMIN}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Design homepage');
  });

  test('returns 404 when the task belongs to a different project', async () => {
    const res = await request(app)
      .get('/api/projects/1/tasks/4') // task 4 belongs to project 2
      .set('Authorization', `Bearer ${ADMIN}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/tasks/:taskId', () => {
  test('allows a project member and rejects a non-member', async () => {
    const member = await request(app).get('/api/tasks/1').set('Authorization', `Bearer ${BOB}`);
    expect(member.status).toBe(200);

    const nonMember = await request(app).get('/api/tasks/1').set('Authorization', `Bearer ${CAROL}`);
    expect(nonMember.status).toBe(403);
  });
});

describe('GET /api/tasks/mine', () => {
  test("returns tasks assigned to the caller", async () => {
    const res = await request(app).get('/api/tasks/mine').set('Authorization', `Bearer ${ALICE}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((t) => t.assigneeId === 1)).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('POST /api/projects/:projectId/tasks validation', () => {
  test('accepts a valid "high" priority task', async () => {
    const res = await request(app)
      .post('/api/projects/1/tasks')
      .set('Authorization', `Bearer ${ADMIN}`)
      .send({ title: 'Urgent fix', priority: 'high', assigneeId: 1 });
    expect(res.status).toBe(201);
  });

  test('rejects a task assigned to a nonexistent user', async () => {
    const res = await request(app)
      .post('/api/projects/1/tasks')
      .set('Authorization', `Bearer ${ADMIN}`)
      .send({ title: 'Orphan task', priority: 'low', assigneeId: 9999 });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/tasks/:taskId', () => {
  test('preserves fields not included in the payload, and rejects a non-assignee', async () => {
    const patched = await request(app)
      .patch('/api/tasks/1')
      .set('Authorization', `Bearer ${ALICE}`)
      .send({ completed: true });
    expect(patched.status).toBe(200);
    expect(patched.body.completed).toBe(true);
    expect(patched.body.title).toBe('Design homepage');
    expect(patched.body.priority).toBe('high');

    const rejected = await request(app)
      .patch('/api/tasks/2')
      .set('Authorization', `Bearer ${ALICE}`)
      .send({ completed: true });
    expect(rejected.status).toBe(403);
  });
});

describe('DELETE /api/tasks/:taskId', () => {
  test('allows an admin and rejects a non-admin', async () => {
    const asAdmin = await request(app).delete('/api/tasks/3').set('Authorization', `Bearer ${ADMIN}`);
    expect(asAdmin.status).toBe(204);

    const asUser = await request(app).delete('/api/tasks/1').set('Authorization', `Bearer ${ALICE}`);
    expect(asUser.status).toBe(403);
  });
});

describe('reassignment and caching', () => {
  test("reassigning a task invalidates the old and new assignee's cached task list", async () => {
    await request(app).get('/api/tasks/mine').set('Authorization', `Bearer ${ALICE}`); // warm Alice's cache
    await request(app).get('/api/tasks/mine').set('Authorization', `Bearer ${BOB}`); // warm Bob's cache

    await request(app)
      .patch('/api/tasks/1')
      .set('Authorization', `Bearer ${ADMIN}`)
      .send({ assigneeId: 2 }); // reassign task 1 from Alice to Bob

    const aliceMine = await request(app).get('/api/tasks/mine').set('Authorization', `Bearer ${ALICE}`);
    expect(aliceMine.body.data.some((t) => t.id === 1)).toBe(false);

    const bobMine = await request(app).get('/api/tasks/mine').set('Authorization', `Bearer ${BOB}`);
    expect(bobMine.body.data.some((t) => t.id === 1)).toBe(true);
  });
});
