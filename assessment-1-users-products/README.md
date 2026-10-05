# Practice Assessment #1 — Users & Products API

## Problem Statement

You have been given an existing Node.js/Express backend that manages two
resources, **users** and **products**. The application starts and runs
normally, but several endpoints do not behave correctly.

Your task is to **fix the implementation so that all tests in `tests/`
pass**, without changing the existing API contract described below.

**Rules:**

- Do not modify any file inside `tests/`.
- You may modify any file inside `src/`.
- The public API contract (routes, query parameters, request/response
  shapes, status codes) described below must be preserved — tests may
  rely on behavior not explicitly called out here too.
- Do not add new npm dependencies.

## Tech Stack

- Node.js + Express
- Jest + Supertest
- In-memory "database" (`src/data/database.js`)
- In-memory Map-based cache (`src/cache/cache.js`)

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

runs the server locally on `http://localhost:3000` (override with the
`PORT` env var).

## API Contract

### Users — `/api/users`

| Method | Path            | Description                          |
|--------|-----------------|---------------------------------------|
| GET    | `/api/users`     | List users                            |
| GET    | `/api/users/:id` | Get a single user by id               |
| POST   | `/api/users`     | Create a user                         |
| PUT    | `/api/users/:id` | Update a user                         |
| DELETE | `/api/users/:id` | Delete a user                         |

**GET /api/users** supports:

- `active` (`true` / `false`) — filter by active status
- `page`, `limit` — pagination (1-indexed `page`)

Response shape:

```json
{ "data": [ /* users */ ], "total": 5, "page": 1, "limit": 10 }
```

**User object:** `{ id, name, email, role, active }`

- `POST /api/users` requires `name` and `email`. Missing either returns
  `400`. On success, returns `201` with the created user (including
  generated `id`).
- `GET /api/users/:id` returns `404` if no user matches.
- `PUT /api/users/:id` returns `404` if no user matches, otherwise `200`
  with the updated user.
- `DELETE /api/users/:id` returns `404` if no user matches, otherwise
  `204` with no body. The user must no longer appear in subsequent GET
  requests.

### Products — `/api/products`

| Method | Path               | Description                       |
|--------|--------------------|------------------------------------|
| GET    | `/api/products`     | List products                     |
| GET    | `/api/products/:id` | Get a single product by id        |
| POST   | `/api/products`     | Create a product                  |
| PUT    | `/api/products/:id` | Update a product                  |
| DELETE | `/api/products/:id` | Delete a product                  |

**GET /api/products** supports:

- `category` — exact match filter
- `active` (`true` / `false`) — filter by active status
- `minPrice`, `maxPrice` — numeric price range filter
- `sort` — sort by field name, e.g. `price`, `name`, `-price` (prefix
  `-` for descending)
- `page`, `limit` — pagination (1-indexed `page`)

Response shape:

```json
{ "data": [ /* products */ ], "total": 8, "page": 1, "limit": 10 }
```

**Product object:** `{ id, name, category, price, active }`

- `POST /api/products` requires `name`, `price`, and `category`. Missing
  any returns `400`. On success, returns `201` with the created product.
- `GET /api/products/:id` returns `404` if no product matches.
- `PUT /api/products/:id` returns `404` if no product matches, otherwise
  `200` with the updated product.
- `DELETE /api/products/:id` returns `404` if no product matches,
  otherwise `204` with no body. The product must no longer appear in
  subsequent GET requests.
- Responses may be served from cache, but a client must never observe
  stale data: a write to a resource must be reflected in every
  subsequent read of that resource, no matter how it's filtered, sorted,
  or paginated.

## Notes

- This is a debugging exercise, not a "build it from scratch" exercise.
  The overall structure and intent of the code is correct; look for
  logic mistakes, not missing files.
- Some tests already pass on a fresh checkout — that's expected. A
  passing test tells you that part of the system already works
  correctly.
- Fixing one bug may cause more than one test to start passing.
