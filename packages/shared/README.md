# @wealth-stack/shared

Platform-agnostic API types and HTTP client for Wealth Stack web and mobile apps.

## Usage

```typescript
import { createWealthStackApi, type TokenStorage } from "@wealth-stack/shared";

const api = createWealthStackApi({
  baseUrl: "http://localhost:8080",
  storage: myTokenStorage,
});

await api.login(email, password);
```

The client automatically refreshes access tokens on `401` using `POST /v1/auth/refresh` (single-flight).

## Build

```bash
npm run build -w @wealth-stack/shared
```

## Tests

```bash
npm run test -w @wealth-stack/shared
```
