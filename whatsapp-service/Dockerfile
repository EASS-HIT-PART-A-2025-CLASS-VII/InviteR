# Dockerfile for InviteR whatsapp-service
FROM ghcr.io/puppeteer/puppeteer:21.5.2

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV DISPLAY=:99

# Create app directory and set permissions
WORKDIR /app
RUN chown -R pptruser:pptruser /app

# Copy package files
COPY --chown=pptruser:pptruser package*.json ./

# Install dependencies
USER pptruser
RUN npm install

# Copy app source
COPY --chown=pptruser:pptruser . .

# Create and set permissions for temporary session directory
RUN mkdir -p /tmp/whatsapp-session && \
    chmod 777 /tmp/whatsapp-session

EXPOSE 5010

# Start Xvfb and run the application
CMD Xvfb :99 -screen 0 1024x768x16 & node sendWhatsAppWave.js 