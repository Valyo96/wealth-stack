# API reference

Base URL (local): `http://localhost:8080`

All JSON responses use an envelope:

```json
{ "data": { } }
```

Errors:

```json
{ "error": { "code": "invalid_input", "message": "..." } }
```

## Health

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | No |
| GET | `/ready` | No |

## Auth

| Method | Path | Body |
|--------|------|------|
| POST | `/v1/auth/register` | `{ "email", "password" }` (password min 8 chars) |
| POST | `/v1/auth/login` | `{ "email", "password" }` |
| POST | `/v1/auth/refresh` | `{ "refresh_token" }` |

Success `data`:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 900
}
```

## Accounts (Bearer required)

| Method | Path | Body |
|--------|------|------|
| GET | `/v1/accounts` | — |
| POST | `/v1/accounts` | `{ "name", "currency?", "account_type?" }` |

## Transactions (Bearer required)

| Method | Path | Query / body |
|--------|------|----------------|
| GET | `/v1/transactions` | `from`, `to` (RFC3339), `account_id` (optional) |
| POST | `/v1/transactions` | `{ "account_id", "amount", "transaction_type", "occurred_at?", "note?", "category_id?" }` |

`transaction_type`: `income` | `expense`

## Dashboard (Bearer required)

| Method | Path | Query |
|--------|------|-------|
| GET | `/v1/dashboard/summary` | `from`, `to`, `period_label` (optional) |

Default period: current calendar month.

Response `data`:

```json
{
  "total_income": "0.00",
  "total_expenses": "0.00",
  "net": "0.00",
  "period_label": "May 2026",
  "period_start": "...",
  "period_end": "..."
}
```
