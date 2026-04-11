# Stage 1: Build
FROM node:20-slim AS builder

# Enable corepack for yarn support
RUN corepack enable

WORKDIR /app

# Copy package.json and yarn.lock if available (for deterministic builds)
COPY package.json yarn.lock* ./

# Install all dependencies (including devDependencies for build)
RUN yarn install

# Copy source code
COPY . .

# Build the project
RUN yarn build

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

# Enable corepack for yarn support
RUN corepack enable

# Copy package.json and yarn.lock
COPY package.json yarn.lock* ./

# Install only production dependencies
RUN yarn install --production

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# The command will be provided by Cloud Run Job configuration
# but we set a sensible default.
# Note: Since the workflow overrides the command, it should point to 
# a script that runs the JS version if we want to avoid tsx at runtime.
# However, to maintain compatibility with existing workflow, 
# we'll keep the CMD but expect it to be overridden.
CMD ["node", "dist/src/jobs/dueWordNotifications.js"]
