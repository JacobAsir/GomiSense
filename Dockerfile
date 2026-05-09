# Stage 1: Build the Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/gomi-sense build

# Stage 2: Build the Backend
FROM node:20-slim AS backend-builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server build

# Stage 3: Production Image
FROM node:20-slim
WORKDIR /app

# Install pnpm for dependency management
RUN npm install -g pnpm

# Copy workspace configuration and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY lib ./lib
COPY artifacts/api-server/package.json ./artifacts/api-server/

# Install only production dependencies for the backend
RUN pnpm install --prod --frozen-lockfile --filter @workspace/api-server

# Copy built backend files
COPY --from=backend-builder /app/artifacts/api-server/dist ./artifacts/api-server/dist

# Copy built frontend files to a public directory served by the backend
COPY --from=frontend-builder /app/artifacts/gomi-sense/dist ./public

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV GEMINI_API_KEY=""
ENV GEMINI_MODEL="gemini-1.5-flash"

# Expose the port
EXPOSE 8080

# Start the application
CMD ["node", "./artifacts/api-server/dist/index.mjs"]
