# CLAUDE.md

## Build & Dev Commands

### admin-api (backend)
```bash
cd admin-api
cp .env.example .env   # first time only
npm install
npm run dev             # local server on http://localhost:9000
npm run build           # tsc → dist/
npm run lint            # eslint src/**/*.ts
npm run deploy:fc       # build + s deploy -y
```

### admin-web (frontend)
```bash
cd admin-web
cp .env.example .env   # first time only
npm install
npm run dev             # Vite on http://localhost:5173
npm run build           # tsc -b + vite build → dist/
npm run lint            # eslint src/**/*.{ts,tsx}
```

No test framework is configured yet.

## Architecture

Monorepo with two packages:

- **admin-web/** — React 18 + Vite + TypeScript + Ant Design + React Router 6. Axios interceptor auto-injects JWT and redirects to login on 401.
- **admin-api/** — Alibaba Cloud Function Compute (Node 18 + TypeScript). Lightweight HTTP handler (no Express). JWT auth + RBAC middleware. Persists users to local JSON with optional OSS JSON persistence.
- **deploy/** — `oss-upload.sh` for static hosting, `fc-deploy.md` for FC. CI/CD via `.github/workflows/deploy.yml`.

### Key directories
| Path | Purpose |
|---|---|
| `admin-web/src/api` | Axios HTTP layer |
| `admin-web/src/pages` | Route pages |
| `admin-web/src/layouts` | Admin shell (sidebar + header) |
| `admin-web/src/store` | Auth state |
| `admin-web/src/router` | Route definitions + guards |
| `admin-api/src/app.ts` | Routing & handlers |
| `admin-api/src/middleware` | JWT validation + RBAC |
| `admin-api/src/services` | User store + OSS persistence |
| `admin-api/src/data/default-users.json` | Demo seed data |

## Data Flow

Browser → Vite dev proxy (`/api` → `localhost:9000`) → `admin-api/src/app.ts` routes request → middleware checks JWT + role → service layer reads/writes `userStore` (in-memory JSON, optionally synced to OSS) → unified JSON response `{ code, data, message }` → Axios interceptor → React state.

## Auth & RBAC

- `POST /api/auth/login` returns JWT access token.
- `GET /api/auth/me` returns current user profile.
- `GET/POST/PUT/DELETE /api/users` — admin only.
- Roles: `admin` (Dashboard, User Management, Settings) | `user` (Dashboard only).

## Code Conventions

- Strict TypeScript; explicit types on functions and exports.
- 2-space indentation.
- React components/pages/layouts: `PascalCase.tsx` (e.g. `UserManagement.tsx`).
- Utility/API modules: lowercase or kebab-case (e.g. `auth.ts`, `auth-storage.ts`).
- Imports: external packages first, then internal.
- API responses always `{ code: number, data: any, message: string }`. `code === 0` is success.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Run ESLint before opening a PR.

## Environment Setup

### Backend (`admin-api/.env`)
Key variables: `JWT_SECRET`, `ALLOW_ORIGIN`, `API_PREFIX` (default `/api`), `OSS_BUCKET`, `OSS_REGION`, `OSS_ENDPOINT`, `OSS_OBJECT_KEY`.

### Frontend (`admin-web/.env`)
Key variables: `VITE_API_BASE` (`/api` for local dev), `VITE_PROXY_TARGET` (dev proxy target).

### Demo accounts
- admin: `admin / admin123`
- user: `user / user123`

## Security Reminders

- Never commit AK/SK, `JWT_SECRET`, or OSS credentials.
- Use `.env` locally, GitHub Secrets in CI.
- Keep `ALLOW_ORIGIN` scoped to known domains.
