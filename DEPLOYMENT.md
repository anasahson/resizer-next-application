# Deploying Resizer AI

The app is two containers plus a database:

| Piece | Technology | Port |
| --- | --- | --- |
| Frontend | Next.js 16 (App Router), `frontend/Dockerfile` | 3000 |
| Backend | Express 5 + sharp, `backend/Dockerfile` | 5000 |
| Database | MySQL 8 / TiDB (managed or the compose service) | 3306 / 4000 |

All image processing happens in the browser or in the backend with `sharp`; images are never
stored in the database. The PDF tool runs entirely client-side, using the pdf.js worker that is
copied into `frontend/public/pdfjs/` by the frontend `postinstall` step.

## Local, everything in Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend health: http://localhost:5000/api/health
- MySQL: `localhost:3306`, data persisted in the `mysql_data` volume

`docker-compose.yml` reads `backend/.env` for secrets. Copy `backend/.env.example` and fill in at
least `JWT_SECRET`, the database credentials, and any optional provider keys you use.

## Render

`render.yaml` is a Render blueprint for the **backend** web service (Docker runtime, health check
on `/api/health`). Create a Blueprint from the repository and Render prompts for every variable
marked `sync: false`; those are secrets and are never stored in git.

Two values come from the frontend deployment and must be filled in after it exists:

- `CORS_ORIGIN` — the frontend origin, comma-separated if you also want preview URLs
- `FRONTEND_URL` — the canonical frontend origin used in emails and redirects

`DB_PORT: 4000` and `DB_NAME: test` in the blueprint match the TiDB Cloud cluster this project was
provisioned with. Change both if you point it at a different database (`3306` and `nextjs_app` are
the compose defaults).

### Frontend on Render

Add a second **Web Service** with runtime Docker, root directory `frontend`, and Dockerfile
`./Dockerfile`. Because Next.js inlines `NEXT_PUBLIC_*` variables at build time, set these as
environment variables on the service before the first build:

- `NEXT_PUBLIC_BACKEND_URL=https://<backend-service>.onrender.com`
- `NEXT_PUBLIC_API_URL=https://<backend-service>.onrender.com/api`

After it deploys, put its URL into the backend `CORS_ORIGIN` and `FRONTEND_URL` variables and
redeploy the backend.

## Any other Docker host

Both images are self-contained:

```bash
docker build -t resizer-frontend ./frontend
docker build -t resizer-backend ./backend
docker run -p 3000:3000 -e NEXT_PUBLIC_BACKEND_URL=https://api.example.com resizer-frontend
docker run -p 5000:5000 --env-file backend/.env resizer-backend
```

The frontend image copies `public/` from its builder stage, so the pdf.js worker, CMaps, fonts and
wasm files are present without any extra CDN at runtime.

## Required backend environment

| Variable | Notes |
| --- | --- |
| `NODE_ENV` | `production` in any deployed environment |
| `CORS_ORIGIN` | Exact frontend origin(s), comma-separated |
| `FRONTEND_URL` | Frontend origin for links and redirects |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL/TiDB connection |
| `DB_SSL` | `true` for managed databases that require TLS |
| `JWT_SECRET` | At least 32 random characters |
| `API_DOCS_USER`, `API_DOCS_PASSWORD` | Gate the API explorer at `/api`; there are no defaults |
| `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` | One-time SuperAdmin bootstrap; existing accounts are not overwritten |

Optional integrations are enabled only when their keys exist: `IMGBB_API_KEY`, `STRIPE_*`,
`VENICE_*`, `GEMINI_API_KEY`, `OPENAI_*`, `AUTH0_*`.

If you rely on upload history or hosting logs in a container, set `HOSTING_LOG_DB=1` so those
records are written to MySQL instead of the container's ephemeral JSONL files.

## Continuous integration

`.github/workflows/ci-and-deploy.yml` runs `npm ci`, lint and a production build for the frontend
and the backend test suite on every push and pull request. It does not deploy; Render builds from
the repository on its own.
