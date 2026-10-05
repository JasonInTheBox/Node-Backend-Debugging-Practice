/**
 * In-memory "database" layer. Simulates an async data store (like a real
 * DB driver would return Promises) using a zero-delay timer.
 */

const initialUsers = [
  { id: 1, name: 'Alice', role: 'user' },
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Carol', role: 'user' },
  { id: 99, name: 'Admin', role: 'admin' },
];

const initialProjects = [
  { id: 1, name: 'Website Redesign', ownerId: 1, memberIds: [1, 2], createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 2, name: 'Mobile App', ownerId: 2, memberIds: [2, 3], createdAt: '2026-01-02T00:00:00.000Z' },
];

const initialTasks = [
  { id: 1, projectId: 1, title: 'Design homepage', completed: false, priority: 'high', assigneeId: 1, createdAt: '2026-01-03T00:00:00.000Z' },
  { id: 2, projectId: 1, title: 'Setup CI', completed: true, priority: 'medium', assigneeId: 2, createdAt: '2026-01-04T00:00:00.000Z' },
  { id: 3, projectId: 1, title: 'Write docs', completed: false, priority: 'low', assigneeId: 1, createdAt: '2026-01-05T00:00:00.000Z' },
  { id: 4, projectId: 2, title: 'Build login', completed: false, priority: 'high', assigneeId: 2, createdAt: '2026-01-06T00:00:00.000Z' },
  { id: 5, projectId: 2, title: 'Write tests', completed: false, priority: 'medium', assigneeId: 3, createdAt: '2026-01-07T00:00:00.000Z' },
];

const initialComments = [
  { id: 1, taskId: 1, userId: 2, message: 'Looks good so far', createdAt: '2026-01-08T00:00:00.000Z' },
  { id: 2, taskId: 1, userId: 1, message: 'Almost done', createdAt: '2026-01-09T00:00:00.000Z' },
];

let users = initialUsers.map((u) => ({ ...u }));
let projects = initialProjects.map((p) => ({ ...p, memberIds: [...p.memberIds] }));
let tasks = initialTasks.map((t) => ({ ...t }));
let comments = initialComments.map((c) => ({ ...c }));

let nextTaskId = initialTasks.length + 1;
let nextCommentId = initialComments.length + 1;

const delay = (fn) => new Promise((resolve) => setTimeout(() => resolve(fn()), 0));

module.exports = {
  // ---- users (read-only reference data) ----
  getAllUsers: () => delay(() => users.map((u) => ({ ...u }))),
  getUserById: (id) => delay(() => users.find((u) => u.id === id)),

  // ---- projects ----
  getAllProjects: () => delay(() => projects.map((p) => ({ ...p, memberIds: [...p.memberIds] }))),
  getProjectById: (id) => delay(() => {
    const p = projects.find((p) => p.id === id);
    return p ? { ...p, memberIds: [...p.memberIds] } : undefined;
  }),

  // ---- tasks ----
  getAllTasks: () => delay(() => tasks.map((t) => ({ ...t }))),
  getTaskById: (id) => delay(() => tasks.find((t) => t.id === id)),
  insertTask: (data) => delay(() => {
    const task = { ...data, id: nextTaskId++ };
    tasks.push(task);
    return task;
  }),
  updateTaskById: (id, data) => delay(() => {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    tasks[idx] = { ...data, id: tasks[idx].id };
    return tasks[idx];
  }),
  deleteTaskById: (id) => delay(() => {
    const exists = tasks.some((t) => t.id === id);
    tasks = tasks.filter((t) => t.id !== id);
    return exists;
  }),

  // ---- comments ----
  getAllComments: () => delay(() => comments.map((c) => ({ ...c }))),
  getCommentById: (id) => delay(() => comments.find((c) => c.id === id)),
  insertComment: (data) => delay(() => {
    const comment = { ...data, id: nextCommentId++ };
    comments.push(comment);
    return comment;
  }),
  deleteCommentById: (id) => delay(() => {
    const exists = comments.some((c) => c.id === id);
    comments = comments.filter((c) => c.id !== id);
    return exists;
  }),

  // ---- test utility ----
  __reset: () => {
    users = initialUsers.map((u) => ({ ...u }));
    projects = initialProjects.map((p) => ({ ...p, memberIds: [...p.memberIds] }));
    tasks = initialTasks.map((t) => ({ ...t }));
    comments = initialComments.map((c) => ({ ...c }));
    nextTaskId = initialTasks.length + 1;
    nextCommentId = initialComments.length + 1;
  },
};
