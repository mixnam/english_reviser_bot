# Use node 20 slim as base image
FROM node:20-slim

# Set working directory to /app
WORKDIR /app

# Copy package.json to install dependencies
COPY package.json ./

# Install dependencies for the server package
# Note: Since this is part of a monorepo, if you have a root yarn.lock, 
# you should copy it here for deterministic builds.
RUN yarn install

# Copy the rest of the server source code
COPY . .

# Default command to run the job
CMD ["yarn", "run", "notify:due-words"]
