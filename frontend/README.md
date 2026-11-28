This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy

Run the full stack with Docker Compose from the repository root (`docker compose up --build`), or deploy the `frontend` and `backend` Dockerfiles to any host that can run Node and MySQL. See [DEPLOYMENT.md](../DEPLOYMENT.md) for Render and Docker details.

## Optional background removal

The AI background-removal page requires a server-side `REMOVE_BG_API_KEY` and a comma-separated `REMOVE_BG_ALLOWED_USER_IDS` allowlist in the backend environment. It is disabled for accounts not explicitly allowed, and images are sent to the configured provider only when a signed-in user submits a request. Never expose the provider key in frontend variables. The current remove.bg API documentation announces a provider transition starting December 1, 2026; verify the provider endpoint and account before enabling it after that date.
