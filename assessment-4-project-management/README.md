# Backend Debugging Assessment #4 — Project Management API (Nested Routes, Ownership & Caching)

## Problem Statement

You have been given an existing Node.js/Express backend for a small
project-management tool: **projects**, **tasks**, and **comments**,
gated by token-based authentication with ownership/membership-based
authorization, and a response cache over task and comment lists. The
application starts and runs normally, but several endpoints do not
behave correctly.

Your task is to **fix the implementation so that all tests in `tests/`
pass**, without changing the existing API contract described below.

**Rules:**

- Do not modify any file inside `tests/`.
- You may modify any file inside `src/`.
- The public API contract (routes, request/response shapes, status
  codes, auth/ownership behavior) described below must be preserved.
- Do not add new npm dependencies.
- Prefer the smallest fix that makes the behavior correct.

## Tech Stack

- Node.js + Express
- Jest + Supertest
- In-memory "database" (`src/data/database.js`)
- In-memory Map-based cache (`src/cache/cache.js`)
- Simplified bearer-token authentication

## Getting Started

```bash
npm install
npm test
```

```bash
npm start
```

runs the server on `http://localhost:3003` (override with `PORT`).

## Architecture

```
request → route → middleware → controller → service → repository → data/cache
```

```
src/
  app.js, server.js
  routes/{projects.routes.js, tasks.routes.js, comments.routes.js}
  controllers/{projects.controller.js, tasks.controller.js, comments.controller.js}
  services/{projects.service.js, tasks.service.js, comments.service.js}
  repositories/{projects.repository.js, tasks.repository.js, comments.repository.js, users.repository.js}
  middleware/{auth.middleware.js, projectAccess.middleware.js, admin.middleware.js, error.middleware.js}
  validation/{tasks.validation.js, comments.validation.js}
  cache/cache.js
  data/database.js
```

## Authentication & Authorization

```
Authorization: Bearer <token>
```

| Token           | User id | Role   |
|-----------------|---------|--------|
| `user-1-token`  | 1       | `user` |
| `user-2-token`  | 2       | `user` |
| `user-3-token`  | 3       | `user` |
| `admin-token`   | 99      | `admin`|

Seed data: **project 1** ("Website Redesign") is owned by user 1, with
members `[1, 2]`. **project 2** ("Mobile App") is owned by user 2, with
members `[2, 3]`.

- A missing, malformed, or invalid token returns `401`.
- An authenticated request attempting something it isn't permitted to
  do returns `403`.

Permission rules:

- Any **project member** can view the project and its tasks.
- Only the **project owner** can create tasks in that project.
- A task's **assignee** can update that task (`PATCH`); anyone else
  (other than an admin) gets `403`.
- Only an **admin** can delete a task.
- Any **project member** (of the task's project) can view and create
  comments on a task.
- A **comment's author** can delete their own comment; an **admin**
  can delete any comment; anyone else gets `403`.

## API Contract

### Projects — `/api/projects`

| Method | Path                                | Description                          |
|--------|-------------------------------------|-----------------------------------------|
| GET    | `/api/projects`                      | List projects the caller belongs to (admins see all) |
| GET    | `/api/projects/:projectId`            | Get a project's details               |
| GET    | `/api/projects/:projectId/tasks`      | List tasks in a project               |
| GET    | `/api/projects/:projectId/tasks/:taskId` | Get one task, scoped to that project |
| POST   | `/api/projects/:projectId/tasks`      | Create a task in a project             |

`GET /api/projects/:projectId/tasks/:taskId` must return `404` if the
task exists but belongs to a *different* project than the one in the
URL.

**GET .../tasks** supports:

- `completed` (`true` / `false`)
- `priority` (`low` / `medium` / `high`)
- `assigneeId`
- `sort`, `order` (`asc`/`desc`, default `asc`)
- `page`, `limit` (1-indexed `page`)

All can be combined. Response shape: `{ data: [...], total, page, limit }`.

**Project object:** `{ id, name, ownerId, memberIds, createdAt }`
**Task object:** `{ id, projectId, title, completed, priority, assigneeId, createdAt }`

`POST .../tasks` requires a non-empty `title`, a `priority` of
`low`/`medium`/`high`, and an `assigneeId` that refers to an existing
user. Invalid payloads return `400`. On success, returns `201` with
the created task.

### Tasks — `/api/tasks`

| Method | Path                       | Description                     |
|--------|----------------------------|------------------------------------|
| GET    | `/api/tasks/:taskId`        | Get a task by id (project member) |
| GET    | `/api/tasks/mine`            | List tasks assigned to the caller |
| GET    | `/api/tasks/:taskId/comments`| List a task's comments (project member) |
| POST   | `/api/tasks/:taskId/comments`| Add a comment to a task (project member) |
| PATCH  | `/api/tasks/:taskId`         | Partially update a task (assignee only) |
| DELETE | `/api/tasks/:taskId`         | Delete a task (admin only)         |

`GET /api/tasks/mine` returns `{ data: [...] }` — every task currently
assigned to the caller.

`PATCH /api/tasks/:taskId` is a **partial** update — fields not
included in the request body must be left unchanged (including
`priority`, `title`, and `assigneeId` when only e.g. `completed` is
sent). Returns `404` if no task matches, `403` if the caller isn't the
assignee (or admin), `400` for invalid fields, otherwise `200` with
the full updated task.

`DELETE /api/tasks/:taskId` returns `404` if no task matches,
otherwise `204`.

### Comments — `/api/comments`

| Method | Path                    | Description                        |
|--------|-------------------------|---------------------------------------|
| DELETE | `/api/comments/:commentId` | Delete a comment (owner or admin) |

**Comment object:** `{ id, taskId, userId, message, createdAt }`

Comment creation (`POST /api/tasks/:taskId/comments`) requires a
non-empty `message`. On success returns `201` with the created
comment.

## Caching

Task lists (per project, per filter/sort/page combination) and task
comment lists are cached. A client must never observe stale data:
creating, updating, or deleting a task must be reflected in every
subsequent read of that project's task list (and of `/api/tasks/mine`
for whichever user(s) are affected by an assignment change), no
matter how the read is filtered, sorted, or paginated. The same
applies to comments after they're created. Requests that differ in
their filters, sort, or page must not share a cached result, and
different projects must never share cached results with each other.

## Notes

- This is a debugging exercise, not a "build it from scratch" exercise.
  The overall structure and intent of the code is correct; look for
  logic mistakes, not missing files.
- Some tests already pass on a fresh checkout — that's expected.
- A single test may depend on more than one underlying fix — if a test
  still fails after your first fix, keep tracing through the layers
  listed above.
