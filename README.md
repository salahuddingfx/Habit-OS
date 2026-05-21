# Habit-OS

A fully offline-first **PWA** for tracking health and daily habits — built with React, Vite, Dexie.js, and a Node.js backend.

![Health & Habit OS](https://github.com/salahuddingfx.png)

## Features

- **Custom Dashboard** — drag-and-drop widgets (Streak, XP, Progress, Heatmap, Badges)
- **Habit & Goal Tracking** — daily, weekly, monthly with progress rings
- **Plan Templates** — 8 built-in templates + custom habit builder
- **30-Day Challenges** — calendar dot grid + daily check-in
- **Mood Tracker** — 5-level logging with 14-day bar chart
- **Body Stats + BMI** — weight, body fat, muscle, waist tracker
- **Food Tracker** — Open Food Facts API + presets + manual entry
- **AI Coach** — personalized daily briefing with typewriter effect + chat
- **Social & Friends** — activity feed, reactions, friend search
- **Smart Reminders** — Web Notifications API, per-habit, multiple times
- **Data Export** — PDF, XLSX, CSV, JSON
- **15 Achievement Badges** — auto-unlocked based on real habit data
- **Bangla / English** — instant language switch (Globe button in header)
- **Light / Dark Theme** — default light, persisted to localStorage
- **PWA Ready** — installable, offline-first with Workbox

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite 6 |
| Styling | Tailwind CSS v4 + custom CSS variables |
| Local DB | Dexie.js (IndexedDB) |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Node.js + Express + MongoDB |
| Realtime | Socket.io |
| PWA | Vite PWA Plugin + Workbox |

## Quick Start

```bash
# Install frontend dependencies
npm install

# Start frontend dev server
npm run dev

# Start backend server (in another terminal)
cd server
npm install
npm start
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:5000`

## Environment Variables

Create `server/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

## Developer

**Salah Uddin Kader**  
[salahuddin.codes](https://salahuddin.codes) · [GitHub @salahuddingfx](https://github.com/salahuddingfx)
