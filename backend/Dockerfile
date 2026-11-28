FROM node:22-bookworm-slim

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Expose backend port
EXPOSE 5000

CMD ["node", "src/server.js"]
