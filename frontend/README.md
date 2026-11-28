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

## Browser-based background removal

The `/remove-background` tool uses Transformers.js with the `xrds/isnet-general-onnx-int8` model. Model files (about 45 MB) download from Hugging Face on first use and are cached by the browser; the selected image is processed locally and is not uploaded for background removal. Images over 2048 px on the longest edge are resized before inference to reduce memory use. The runtime is Apache-2.0 and the model is MIT-licensed.
