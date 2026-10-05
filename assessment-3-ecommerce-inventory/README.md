# Backend Debugging Assessment #3 — E-Commerce (Products, Orders, Inventory & Caching)

## Problem Statement

You have been given an existing Node.js/Express backend for a small
e-commerce API: **products** (with inventory) and **orders**, gated by
token-based authentication/authorization, with a response cache on the
product catalog. The application starts and runs normally, but several
endpoints do not behave correctly.

Your task is to **fix the implementation so that all tests in `tests/`
pass**, without changing the existing API contract described below.

**Rules:**

- Do not modify any file inside `tests/`.
- You may modify any file inside `src/`.
- The public API contract (routes, query parameters, request/response
  shapes, status codes, auth behavior) described below must be
  preserved.
- Do not add new npm dependencies.
- Prefer the smallest fix that makes the behavior correct — this is a
  debugging exercise, not a redesign.

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

runs the server locally on `http://localhost:3002` (override with the
`PORT` env var).

## Architecture

```
request → route → middleware → controller → service → repository → data/cache
```

```
src/
  app.js, server.js
  routes/{products.routes.js, orders.routes.js}
  controllers/{products.controller.js, orders.controller.js}
  services/{products.service.js, orders.service.js}
  repositories/{products.repository.js, orders.repository.js}
  middleware/{auth.middleware.js, admin.middleware.js, error.middleware.js}
  validation/{products.validation.js, orders.validation.js}
  cache/cache.js
  data/database.js
```

## Authentication & Authorization

Some routes require a bearer token:

```
Authorization: Bearer <token>
```

Two tokens are pre-seeded for testing:

| Token          | User id | Role    |
|----------------|---------|---------|
| `user-token`   | 1       | `user`  |
| `admin-token`  | 99      | `admin` |

- A missing, malformed, or invalid token on a protected route returns
  `401`.
- An authenticated request attempting an action it isn't allowed to
  perform (e.g. a non-admin writing to products, or deleting an order)
  returns `403`.

## API Contract

### Products — `/api/products`

| Method | Path                | Auth       | Description          |
|--------|---------------------|------------|------------------------|
| GET    | `/api/products`      | public     | List products          |
| GET    | `/api/products/:id`   | public     | Get a product by id     |
| POST   | `/api/products`       | admin only | Create a product        |
| PATCH  | `/api/products/:id`   | admin only | Partially update a product |
| DELETE | `/api/products/:id`   | admin only | Delete a product        |

**GET /api/products** supports:

- `category` — exact match filter
- `inStock` (`true` / `false`) — filter by whether `inventory > 0`
- `minPrice`, `maxPrice` — numeric price range filter
- `search` — case-insensitive substring match on `name`
- `sort`, `order` (`asc` / `desc`, default `asc`) — sort by a field
  name, e.g. `sort=price&order=desc`
- `page`, `limit` — pagination (1-indexed `page`)

All of the above can be combined in a single request.

Response shape: `{ data: [...], total, page, limit }`.

**Product object:** `{ id, sku, name, category, price, inventory }`

- `POST /api/products` requires a non-empty `name`, a positive
  `price`, a non-negative `inventory` (zero is a valid amount of
  stock), a `category`, and a `sku`. Invalid payloads return `400`. On
  success, returns `201` with the created product.
- `GET /api/products/:id` returns `404` if no product matches.
- `PATCH /api/products/:id` performs a **partial** update — fields not
  included in the request body must be left unchanged. Returns `404`
  if no product matches, otherwise `200` with the full updated
  product.
- `DELETE /api/products/:id` returns `404` if no product matches,
  otherwise `204`.
- Product responses may be served from cache, but a client must never
  observe stale data: creating, updating, or deleting a product (and,
  importantly, **placing or cancelling an order**, since that changes
  a product's inventory) must be reflected in every subsequent read,
  no matter how that read is filtered, sorted, or paginated. Requests
  that differ in their filters, sort, or page must not share a cached
  result.

### Orders — `/api/orders`

| Method | Path              | Auth       | Description            |
|--------|-------------------|------------|--------------------------|
| GET    | `/api/orders`      | admin only | List all orders          |
| GET    | `/api/orders/:id`   | admin only | Get an order by id       |
| POST   | `/api/orders`       | required   | Create an order           |
| DELETE | `/api/orders/:id`   | admin only | Cancel/delete an order    |

**Order object:** `{ id, productId, userId, quantity, status }`

`POST /api/orders` body: `{ "productId": 3, "quantity": 2 }`

A valid order requires:

- an authenticated caller (any role)
- a `productId` that refers to an existing product
- a positive numeric `quantity`
- enough inventory on the product to fulfill the quantity

On success: creates the order, **decreases the product's inventory by
the ordered quantity**, and returns `201` with the created order.
Invalid or unfulfillable requests return `400`.

`DELETE /api/orders/:id` (admin only) removes the order and **restores
the product's inventory** by the order's quantity. Returns `404` if no
order matches, otherwise `204`.

## Notes

- This is a debugging exercise, not a "build it from scratch" exercise.
  The overall structure and intent of the code is correct; look for
  logic mistakes, not missing files.
- Some tests already pass on a fresh checkout — that's expected. A
  passing test tells you that part of the system already works
  correctly.
- A single test may depend on more than one underlying fix — if a test
  still fails after your first fix, keep tracing through the layers
  listed above.
