# ---- Smart Campus backend ----
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching).
COPY package*.json ./
RUN npm install --omit=dev

# Copy source.
COPY src ./src

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Simple container healthcheck hitting the health route.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
