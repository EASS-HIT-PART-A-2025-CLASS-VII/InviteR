# Dockerfile for InviteR backend (Node.js/Express)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose backend port
EXPOSE 5002

# Start with nodemon for dev (change to npm start for production)
CMD ["npm", "run", "dev"] 