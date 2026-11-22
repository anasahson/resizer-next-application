# Vercel deployment

This repository deploys the frontend and Express backend as two Vercel projects. The projects can belong to separate Vercel accounts; GitHub Actions deploys each only after both projects pass CI.

## One-time setup

1. Create a Vercel project for `frontend/` in the frontend account and a separate project for `backend/` in the backend account. Connect both projects to this GitHub repository and set each project's Root Directory to its respective folder.
2. Disable automatic Git deployments for both projects so they cannot deploy before the workflow checks pass.
3. Add these repository Actions secrets. Each token must have access to its corresponding Vercel project:
   - `VERCEL_FRONTEND_TOKEN`, `VERCEL_FRONTEND_ORG_ID`, `VERCEL_FRONTEND_PROJECT_ID`
   - `VERCEL_BACKEND_TOKEN`, `VERCEL_BACKEND_ORG_ID`, `VERCEL_BACKEND_PROJECT_ID`
4. Configure the backend project's production environment:
   - Required: `NODE_ENV=production`, `CORS_ORIGIN`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true` when required by the database provider, `JWT_SECRET` (at least 32 random characters), `API_DOCS_USER`, and `API_DOCS_PASSWORD`.
   - Set `FRONTEND_URL` to the frontend's production origin. `CORS_ORIGIN` may contain a comma-separated list of exact frontend production and preview origins.
   - Configure `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` if the one-time SuperAdmin bootstrap is needed. Use a unique password; existing accounts are not overwritten.
   - Add any enabled service credentials (such as `IMGBB_API_KEY`, Stripe, or AI provider keys) in Vercel project settings, never in the repository.
   - For Auth0 user administration, set `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, and `AUTH0_AUDIENCE`. These credentials are server-side only. Use the least-privileged Management API scopes needed for the Auth0 routes.
   - Use a managed MySQL database reachable from Vercel, with TLS enabled where supported. `DB_CONNECTION_LIMIT` defaults to 5 on Vercel.
5. Configure the frontend project's production environment:
   - `NEXT_PUBLIC_API_URL=https://<backend-domain>/api`
   - `NEXT_PUBLIC_BACKEND_URL=https://<backend-domain>`
   Both variables are public URLs, not secrets. Set the same values for preview deployments if preview builds should call the production backend.
6. Merge to the repository's default branch. The workflow runs frontend lint/build and backend smoke/regression tests first, then deploys both projects. Pull requests run checks but do not deploy.

## Vercel-specific behavior

- The backend is exported as an Express app from `backend/index.js`; it does not start a persistent `app.listen()` server on Vercel.
- Each warm backend instance initializes its MySQL connection and schema once. Database initialization failures return HTTP 503 rather than silently running without a database.
- Vercel's request-body ceiling is 20 MiB. The backend rejects upload requests above 18 MiB and caps an individual uploaded file at 16 MiB on Vercel. Local/Docker uploads retain the configured limit (50 MiB by default). Batch requests share the 18 MiB request cap.
- Vercel's filesystem is ephemeral. Upload-history and hosting-log metadata therefore use the existing MySQL `image_hosting_logs` table on Vercel; local deployments continue to use JSONL files.
- The API explorer at `/api` requires `API_DOCS_USER` and `API_DOCS_PASSWORD`. There are no built-in credentials or fallbacks.
