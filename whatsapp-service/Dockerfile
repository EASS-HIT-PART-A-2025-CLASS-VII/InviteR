# Dockerfile for InviteR whatsapp-service
FROM node:20-alpine

# Install dependencies for Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Create and set permissions for temporary session directory
RUN mkdir -p /tmp/whatsapp-session && \
    chmod 777 /tmp/whatsapp-session

EXPOSE 5010

CMD ["node", "sendWhatsAppWave.js"] 