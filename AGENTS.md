# Repository Guidelines

## Project Structure & Module Organization
- `admin-web/`: React + Vite frontend. Main folders: `src/api` (HTTP layer), `src/pages` (route pages), `src/layouts` (admin shell), `src/store` (auth state), `src/router` (route guards).
- `admin-api/`: Function Compute backend (TypeScript). Main folders: `src/app.ts` (routing/handlers), `src/middleware` (JWT/RBAC), `src/services` (user store + optional OSS persistence), `src/data/default-users.json` (demo seed data).
- `.github/workflows/deploy.yml`: CI/CD for OSS upload and FC deployment.

No dedicated test directories are present yet.

## Build, Test, and Development Commands
- Backend local run:
```bash
cd admin-api && npm install && npm run dev
```
Starts local API on `http://localhost:9000`.
- Backend build/lint:
```bash
cd admin-api && npm run build
cd admin-api && npm run lint
```
- Frontend local run:
```bash
cd admin-web && npm install && npm run dev
```
Runs Vite on `http://localhost:5173` with `/api` proxy.
- Frontend build/lint:
```bash
cd admin-web && npm run build
cd admin-web && npm run lint
```
- FC deploy:
```bash
cd admin-api && npm run deploy:fc
```
Requires Serverless Devs config and env vars.

## Coding Style & Naming Conventions
- Use strict TypeScript; keep functions and types explicit.
- Use 2-space indentation and consistent import grouping (external first).
- React components/pages/layouts use `PascalCase.tsx` (for example `UserManagement.tsx`).
- Utility/API modules use lowercase or kebab-case (`auth.ts`, `auth-storage.ts`).
- Keep API response format unified: `{ code, data, message }`.
- Run ESLint before opening a PR.

## Testing Guidelines
- Automated tests are not configured yet.
- Minimum validation for each change:
  - login success/failure,
  - `/auth/me` with valid/invalid token,
  - RBAC checks (`user` blocked from `/users` and `/settings`),
  - admin CRUD for `/users`.
- If adding tests, place:
  - backend: `admin-api/src/**/*.test.ts`
  - frontend: `admin-web/src/**/*.test.tsx`
  and document the run command in the PR.

## Commit & Pull Request Guidelines
- The repository currently has no commit history convention; use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- PRs should include:
  - concise scope summary,
  - changed paths (for example `admin-web/src/pages/*`),
  - env var/config changes,
  - screenshots for UI updates,
  - commands used to validate.

## Security & Configuration Tips
- Use `.env` for local dev and GitHub Secrets for CI.
- Never commit AccessKey, JWT secret, or OSS credentials.
- Keep `ALLOW_ORIGIN` explicit for OSS domain and localhost origins.
