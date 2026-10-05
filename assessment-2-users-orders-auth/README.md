# Backend Debugging Practice Assessment #2 — Users, Orders & Auth API

## Problem Statement

You have been given an existing Node.js/Express backend that manages
**users** and **orders**, with token-based authentication/authorization
on part of the orders API and a lightweight response cache. The
application starts and runs normally, but several endpoints do not
behave correctly.

Your task is to **fix the implementation so that all tests in `tests/`
pass**, without changing the existing API contract described below.

**Rules:**

- Do not modify any file inside `tests/`.
- You may modify any file inside `src/`.
- The public API contract (routes, query parameters, request/response
  shapes, status codes, auth behavior) described below must be
  preserved — tests may rely on behavior not explicitly spelled out
  here too.
- Do not add new npm dependencies.

## Tech Stack

- Node.js + Express
- Jest + Supertest
- In-memory "database" (`src/data/database.js`)
- In-memory Map-based cache (`src/cache/cache.js`)
- Simplified bearer-token authentication (no external auth library)

## Getting Started

```bash
npm install
npm test
```

On a fresh checkout, `npm test` will show a mix of passing and failing
tests. Your job is to make them all pass.

```bash
npm start
```

runs the server locally on `http://localhost:3001` (override with the
`PORT` env var).

## Architecture

```
route → middleware → controller → service → repository → database/cache
```

```
src/
  app.js, server.js
  routes/{users.routes.js, orders.routes.js}
  controllers/{users.controller.js, orders.controller.js}
  services/{users.service.js, orders.service.js}
  repositories/{users.repository.js, orders.repository.js}
  middleware/{auth.middleware.js, error.middleware.js}
  validation/{users.validation.js, orders.validation.js}
  cache/cache.js
  data/database.js
```

## Authentication

Some order routes require a bearer token:

```
Authorization: Bearer <token>
```

Two tokens are pre-seeded for testing:

| Token                 | User          | Role       |
|------------------------|---------------|------------|
| `admin-token-123`      | Alice Johnson | `admin`    |
| `customer-token-456`   | Bob Smith     | `customer` |

A missing or invalid token on a protected route must return `401`. An
authenticated request attempting an action it isn't allowed to perform
must return `403`.

## API Contract

### Users — `/api/users` (no authentication required)

| Method | Path            | Description              |
|--------|-----------------|----------------------------|
| GET    | `/api/users`     | List users                |
| GET    | `/api/users/:id` | Get a single user by id   |
| POST   | `/api/users`     | Create a user             |
| PUT    | `/api/users/:id` | Update a user             |
| DELETE | `/api/users/:id` | Delete a user             |

**GET /api/users** supports:

- `role` — filter by exact role match
- `active` (`true` / `false`) — filter by active status
- `page`, `limit` — pagination (1-indexed `page`)

Response shape: `{ data: [...], total, page, limit }`.

**User object:** `{ id, name, email, role, active }`

- `POST /api/users` requires `name`, a valid `email`, and a `role` of
  either `admin` or `customer`. Missing/invalid fields return `400`.
  Creating a user with an email that already exists returns `409`.
  On success, returns `201` with the created user.
- `GET /api/users/:id` returns `404` if no user matches.
- `PUT /api/users/:id` returns `404` if no user matches, otherwise
  `200` with the updated user.
- `DELETE /api/users/:id` returns `404` if no user matches, otherwise
  `204`. The user must no longer appear in subsequent GET requests.

### Orders — `/api/orders`

| Method | Path                | Auth       | Description                    |
|--------|---------------------|------------|----------------------------------|
| GET    | `/api/orders`        | public     | List orders                     |
| GET    | `/api/orders/:id`     | public     | Get a single order by id        |
| GET    | `/api/orders/mine`    | required   | List the caller's own orders    |
| POST   | `/api/orders`         | required   | Create an order                 |
| PUT    | `/api/orders/:id`     | required   | Update an order                 |
| DELETE | `/api/orders/:id`     | admin only | Delete an order                 |

**GET /api/orders** supports:

- `status` — exact match filter (`pending`, `shipped`, `delivered`,
  `cancelled`)
- `userId` — filter by owning user
- `sort` — sort by field name, e.g. `quantity`, `-quantity` (prefix
  `-` for descending)
- `page`, `limit` — pagination (1-indexed `page`)

Filtering, sorting, and pagination must all be correct **in
combination**, not just individually — for example, filtering by
`status` with a small `limit` must still return the right set of
matching orders.

Response shape: `{ data: [...], total, page, limit }`.

**GET /api/orders/mine** returns `{ data: [...], total }` containing
only orders belonging to the authenticated caller.

**Order object:** `{ id, userId, product, quantity, status }`

- `POST /api/orders` requires a numeric `userId` that refers to an
  existing user, a non-empty `product`, and a positive `quantity`.
  `status` defaults to `pending` if omitted, otherwise must be one of
  the allowed statuses. Invalid or unresolvable payloads return `400`.
  On success, returns `201` with the created order.
- `GET /api/orders/:id` returns `404` if no order matches. Two
  different valid ids must never return the same order's data.
- `PUT /api/orders/:id` returns `404` if no order matches, otherwise
  `200` with the updated order.
- `DELETE /api/orders/:id` requires an admin token; a non-admin
  authenticated caller gets `403`. Returns `404` if no order matches,
  otherwise `204`.
- Responses may be served from cache, but a client must never observe
  stale data: a write to a resource must be reflected in every
  subsequent read of that resource, no matter how it's filtered,
  sorted, or paginated. Requests that differ in their filters, sort
  order, or page must not share a cached result.

## Notes

- This is a debugging exercise, not a "build it from scratch" exercise.
  The overall structure and intent of the code is correct; look for
  logic mistakes, not missing files.
- Some tests already pass on a fresh checkout — that's expected. A
  passing test tells you that part of the system already works
  correctly.
- A single test may depend on more than one underlying fix — if a test
  still fails after your first fix, keep tracing.
