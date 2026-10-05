const request = require('supertest');
const app = require('../src/app');
const db = require('../src/data/database');
const cache = require('../src/cache/cache');

const ALICE = 'user-1-token'; // member of project 1
const BOB = 'user-2-token'; // member of project 1, wrote comment 1
const CAROL = 'user-3-token'; // not a member of project 1
const ADMIN = 'admin-token';

beforeEach(() => {
  db.__reset();
  cache.clear();
});

describe('GET /api/tasks/:taskId/comments', () => {
  test('returns comments for a project member', async () => {
    const res = await request(app).get('/api/tasks/1/comments').set('Authorization', `Bearer ${ALICE}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  test('rejects a non-member of the task\'s project', async () => {
    const res = await request(app).get('/api/tasks/1/comments').set('Authorization', `Bearer ${CAROL}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/tasks/:taskId/comments', () => {
  test('creates a comment as a project member', async () => {
    const res = await request(app)
      .post('/api/tasks/1/comments')
      .set('Authorization', `Bearer ${ALICE}`)
      .send({ message: 'New comment' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('New comment');
  });

  test('rejects a non-member of the task\'s project', async () => {
    const res = await request(app)
      .post('/api/tasks/1/comments')
      .set('Authorization', `Bearer ${CAROL}`)
      .send({ message: 'Sneaky comment' });
    expect(res.status).toBe(403);
  });

  test('rejects an empty message', async () => {
    const res = await request(app)
      .post('/api/tasks/1/comments')
      .set('Authorization', `Bearer ${ALICE}`)
      .send({ message: '' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/comments/:commentId', () => {
  test('allows the comment owner to delete their own comment', async () => {
    const res = await request(app).delete('/api/comments/1').set('Authorization', `Bearer ${BOB}`);
    expect(res.status).toBe(204);
  });

  test('allows an admin to delete any comment', async () => {
    const res = await request(app).delete('/api/comments/1').set('Authorization', `Bearer ${ADMIN}`);
    expect(res.status).toBe(204);
  });
});
