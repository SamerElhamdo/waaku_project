# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Install Chrome dependencies for whatsapp-web.js
RUN apk add \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Chrome executable path for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Extra envs to stabilize Puppeteer
ENV NODE_OPTIONS=--max_old_space_size=512

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install all dependencies (including dev) for build
RUN npm ci

# Copy source code (exclude what's in .dockerignore)
# This will copy all files including the new router and views
COPY . .

# Build the frontend
ARG VITE_API_KEY
ARG VITE_API_BASE_URL
# Add build timestamp to bust cache
ARG BUILD_DATE=unknown
ENV BUILD_DATE=$BUILD_DATE
RUN VITE_API_KEY=$VITE_API_KEY \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    npm run build

# Prune devDependencies for a slimmer production image
RUN npm prune --production && npm cache clean --force

# Expose port
EXPOSE 4300

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Clean and create empty directories for WhatsApp sessions and cache
# This ensures fresh start on every build (sessions are managed via export/import)
RUN rm -rf /usr/src/app/.wwebjs_auth /usr/src/app/.wwebjs_cache && \
    mkdir -p /usr/src/app/.wwebjs_auth /usr/src/app/.wwebjs_cache && \
    chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Start the application
CMD ["npm", "start"]
