# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY data ./data
COPY docs ./docs
COPY index.html ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Build frontend
RUN npm run frontend:build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy source code (needed for tsx runtime)
COPY src ./src

# Copy all data (policies, schemas, lookups, demo patients, evaluations, etc.)
COPY data ./data

# Copy docs (includes insurance_hackathon_final_data_package with formulary data)
COPY docs ./docs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start server
CMD ["node", "--import", "tsx/esm", "src/server/index.ts"]
