# InviteR - Event Invitation Management System

InviteR is a modular platform for managing event invitations, guest lists, and automated WhatsApp messaging. It is built as a microservices architecture with a React frontend, Node.js/Express backend, a dedicated WhatsApp service, and MongoDB for storage. The system is fully Dockerized for easy deployment and development.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Folder Structure](#architecture--folder-structure)
3. [Features](#features)
4. [Quick Start with Docker](#quick-start-with-docker)
5. [Local Development (without Docker)](#local-development-without-docker)
6. [WhatsApp Service: QR Code & Troubleshooting](#whatsapp-service-qr-code--troubleshooting)
7. [Environment Variables](#environment-variables)
8. [Useful Commands](#useful-commands)
9. [Common Issues & Solutions](#common-issues--solutions)
10. [Contribution](#contribution)
11. [License](#license)

---

## Project Overview
InviteR allows event hosts to:
- Manage guest lists and RSVPs
- Send personalized invitations and reminders via WhatsApp
- Track responses and manage event waves
- Integrate with payment platforms (Bit, Paybox)

---

## Architecture & Folder Structure
```
InviteR/
├── backend/            # Node.js/Express API, MongoDB models, business logic
├── frontend/           # React app (Vite, TypeScript, Material-UI)
├── whatsapp-service/   # Microservice for WhatsApp automation (whatsapp-web.js)
├── docker-compose.yml  # Orchestrates all services
├── .gitignore
└── README.md
```
- **backend/**: Handles API, authentication, guest/event management, and scheduling.
- **frontend/**: User/admin dashboard, RSVP forms, guest management UI.
- **whatsapp-service/**: Sends WhatsApp messages, manages QR login, OTP, and dynamic message variables.

---

## Features
- 🎨 Custom invitation design
- 📱 Mobile-friendly UI
- 📊 Guest list & RSVP management
- 📨 WhatsApp & SMS reminders (via microservice)
- 💰 Bit & Paybox integration for gifts
- 🛠️ Multi-wave invitations (send in batches)
- 🕒 Scheduling & automation
- 🐳 Full Docker support

---

## Quick Start with Docker
**Recommended for most users!**

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd InviteR
   ```
2. **Build and start all services:**
   ```bash
   docker compose up --build
   ```
   This will start:
   - MongoDB (port 27017)
   - Backend API (port 5002)
   - WhatsApp service (port 5010)
   - Frontend (port 5173)

3. **Access the app:**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5002](http://localhost:5002)
   - WhatsApp Service: [http://localhost:5010](http://localhost:5010)

4. **First-time WhatsApp setup:**
   - Run: `docker logs -f inviter-whatsapp`
   - Scan the QR code with your WhatsApp app (Menu > WhatsApp Web > Scan QR)
   - The WhatsApp service must remain connected for messaging to work.

---

## Local Development (without Docker)
**For advanced users and contributors.**

1. **Install dependencies for each service:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ../whatsapp-service && npm install
   ```
2. **Start MongoDB locally** (or use Docker for MongoDB only):
   ```bash
   docker run -d -p 27017:27017 --name inviter-mongo mongo:6
   ```
3. **Start each service in a separate terminal:**
   ```bash
   cd backend && npm run dev
   cd frontend && npm run dev
   cd whatsapp-service && node sendWhatsAppWave.js
   ```
4. **WhatsApp QR (local):**
   - The QR code will appear in your terminal on first run.
   - If you need to reset the session, delete `/tmp/whatsapp-session` and restart the service.

---

## WhatsApp Service: QR Code & Troubleshooting
- **First run:** The WhatsApp service prints a QR code in the terminal/logs. Scan it with your phone.
- **No QR code?** Delete the session folder (`/tmp/whatsapp-session` in Docker, or `whatsapp-service/session/` locally) and restart the service.
- **Browser errors (Puppeteer):**
  - If you see `Failed to launch the browser process!`, make sure Chromium is installed (Docker handles this automatically).
  - For local dev, let Puppeteer download its own Chromium (do not set `executablePath`).
- **Session expired/disconnected:** Delete the session folder and rescan the QR code.
- **Multiple WhatsApp accounts:** Each session is tied to one WhatsApp account. To switch, delete the session and restart.

---

## Environment Variables
- **backend/.env** (example):
  ```env
  MONGODB_URI=mongodb://localhost:27017/inviter
  JWT_SECRET=your_jwt_secret
  NODE_ENV=development
  ```
- **frontend/.env** (example):
  ```env
  VITE_API_URL=http://localhost:5002
  ```
- **whatsapp-service/.env** (optional):
  ```env
  PORT=5010
  ```
- When using Docker Compose, most variables are set in `docker-compose.yml`.

---

## Useful Commands
- **Docker Compose:**
  - `docker compose up --build` – Build and start all services
  - `docker compose down` – Stop all services
  - `docker logs -f inviter-whatsapp` – View WhatsApp QR and logs
- **Backend:**
  - `npm run dev` – Start backend in dev mode
- **Frontend:**
  - `npm run dev` – Start frontend in dev mode
- **WhatsApp Service:**
  - `node sendWhatsAppWave.js` – Start WhatsApp service (local dev)

---

## Common Issues & Solutions
### WhatsApp QR code not showing
- **Solution:** Delete the session folder (`/tmp/whatsapp-session` or `whatsapp-service/session/`), then restart the service.

### Puppeteer/Chromium errors
- **Solution:**
  - In Docker: Chromium is pre-installed.
  - Locally: Let Puppeteer download its own browser (do not set `executablePath`).

### Backend can't reach WhatsApp service
- **Solution:**
  - In Docker: Use the service name (`inviter-whatsapp`) as the host, not `localhost`.
  - Locally: Use `localhost:5010`.

### MongoDB connection issues
- **Solution:**
  - Ensure MongoDB is running (check Docker or local process).
  - Check `MONGODB_URI` in your `.env` or `docker-compose.yml`.

### Port already in use
- **Solution:**
  - Find and kill the process using the port (e.g., `lsof -i :5002` then `kill <pid>`).
  - Or change the port in the config.

### Updating WhatsApp session/account
- **Solution:** Delete the session folder and restart the WhatsApp service to scan a new QR code.

---

## Contribution
Pull requests are welcome! Please open an issue first to discuss major changes.
- Follow code style and naming conventions.
- Add clear commit messages.
- Update documentation as needed.

---

## License
All rights reserved © 2025 InviteR
