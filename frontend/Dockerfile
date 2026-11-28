FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Manifests first so dependency layers cache independently of source changes.
COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

# pdf.js worker, CMap, standard-font and wasm assets are served from public/,
# so they must be generated before the production build runs.
RUN node scripts/copy-pdf-assets.mjs

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

CMD ["npm", "run", "start"]
