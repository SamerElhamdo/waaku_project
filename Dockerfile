# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Install Chrome dependencies for whatsapp-web.js
RUN apk add \
    curl \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_OPTIONS=--max_old_space_size=512

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_KEY
ARG VITE_API_BASE_URL
ARG BUILD_DATE=unknown
ENV BUILD_DATE=$BUILD_DATE

RUN VITE_API_KEY=$VITE_API_KEY \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    npm run build

RUN npm prune --production && npm cache clean --force

EXPOSE 4300

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

CMD ["npm", "start"]
