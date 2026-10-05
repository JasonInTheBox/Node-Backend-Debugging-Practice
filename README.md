# Node.js Backend Debugging Practice

Four self-contained Express/Jest/Supertest repositories, each containing an
existing codebase with deliberate logic bugs. The goal mirrors a
HackerRank-style repository task: run the tests, trace requests through the
layers, and make the smallest fixes needed until every test passes.

Each assessment is independent (its own `package.json`, tests, and README with
the intended API contract). The bugs are intentionally not documented here.

| # | Folder | Theme | Tests (initially failing / total) |
|---|--------|-------|-----------------------------------|
| 1 | `assessment-1-users-products` | CRUD, filtering, pagination, sorting, basic caching | 13 / 25 |
| 2 | `assessment-2-users-orders-auth` | Auth middleware, routing, repository layer, caching | 15 / 31 |
| 3 | `assessment-3-ecommerce-inventory` | 401 vs 403, inventory consistency, async, cache invalidation | 14 / 26 |
| 4 | `assessment-4-project-management` | Nested routes, ownership checks, partial updates, caching | 17 / 38 |

## Running an assessment

```bash
cd assessment-1-users-products   # or any other assessment folder
npm install
npm test
```

## Rules

- Do not modify anything in a `tests/` folder.
- You may change anything in `src/`.
- Preserve the API contract described in that assessment's README.
- Prefer the smallest fix that makes the behavior correct.
- Passing visible tests is not enough: aim for code that would also hold up
  against edge cases the tests don't cover (invalid IDs, `page=0`,
  `active=false`, stale cache after writes, and similar).

## Architecture used throughout

```
request -> route -> middleware -> controller -> service -> repository -> data/cache
```

Stack: Node.js, Express, Jest, Supertest, an in-memory fake database, and an
in-memory `Map` cache.
