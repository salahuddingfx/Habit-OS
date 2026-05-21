# Health & Habit OS — Full Feature Expansion Plan

## Overview
Adding all 12 requested features in 4 batches, ordered by dependency and complexity.

---

## Batch 1 — Quick Wins (no new pages, bolt onto existing)
These are self-contained and go live fast.

### 1. 🏆 Habit Streaks & Achievement Badges
- **Where**: `goalStore.js` + new `badgeStore.js` + Dashboard widget
- **How**:
  - Calculate streaks by checking consecutive `dateKey` completions in Dexie
  - Badge definitions: 7-day streak, 30-day streak, 100% week, first habit, night owl (logged after 10pm), early bird (before 7am), hydration king (water 7 days), etc.
  - Show badges as a trophy shelf on Dashboard and Profile
  - Toast notification when a badge is unlocked

### 2. 🔔 Smart Reminders
- **Where**: New `src/services/reminder.service.js` + Settings panel in Profile
- **How**:
  - Use **Web Notifications API** + **Service Worker** `showNotification`
  - User sets reminder times per habit (e.g. "Water — 9am, 1pm, 6pm")
  - Store reminders in Dexie `reminders` table
  - SW background sync triggers notification at scheduled time

### 3. 🎨 Plan Templates
- **Where**: Plans page — add a "Templates" tab
- **How**:
  - Hardcode 8 starter templates: Weight Loss, Muscle Gain, Better Sleep, Study Routine, Hydration Reset, Mental Wellness, Runner's Plan, Clean Eating
  - User clicks "Use Template" → opens Create drawer pre-filled
  - No DB changes needed

---

## Batch 2 — New Pages

### 4. 📅 30-Day Challenge Mode
- **New page**: `src/pages/Challenges.jsx`
- **DB**: `challenges` table (id, name, habitList, startDate, endDate, completions[])
- **UI**: Calendar grid (like GitHub contributions), daily check-in button, completion streak

### 5. ⚖️ Body Stats Tracker
- **New page**: `src/pages/BodyStats.jsx`
- **DB**: `bodyStats` table (date, weight, bmi, bodyFat, muscleMass, notes)
- **UI**: Form to log today's stats, Recharts line chart over time, BMI calculator

### 6. 😊 Mood Tracker
- **New page** OR **widget on Dashboard**
- **DB**: `moods` table (date, score 1-5, note, timestamp)
- **UI**: 5-button emoji-free mood selector (icons: Frown→Smile scale), weekly bar chart

### 7. 📸 Progress Photos
- **New section in Profile**
- **DB**: `photos` table (date, dataURL, note, type: before/after/progress)
- **UI**: Camera/file upload, photo grid sorted by date, side-by-side comparison view

---

## Batch 3 — Social & AI

### 8. 👥 Friends & Social
- **Server**: `/api/friends` routes — send/accept requests, get friends list
- **DB**: `friends` collection in MongoDB
- **UI**: Friends tab on Leaderboard page, search by username, send encouragement reactions (👏🔥💪), live activity feed via Socket.IO

### 9. 🤖 AI-Powered Weekly Insights
- **Where**: AI Coach page — add "Weekly Report" tab
- **How**:
  - Collect last 7 days of goals from Dexie
  - Build a structured prompt for Gemini: completion rates, streaks, weak spots
  - Display formatted AI report with sections: What went well, Areas to improve, This week's focus

### 10. 📊 Custom Dashboard Widgets
- **Where**: Dashboard page + `src/store/dashboardStore.js`
- **How**:
  - Widget types: Today's Progress ring, Streak counter, Mood chart, Body stats, Leaderboard position, AI tip
  - `dnd-kit` library for drag-and-drop reordering
  - Widget visibility toggles saved to localStorage

---

## Batch 4 — Advanced

### 11. 🌍 Bangla / English Language Switch
- **Where**: `src/i18n/` folder with `en.js` and `bn.js` translation files
- **How**:
  - React Context `LanguageContext` provides `t(key)` translation function
  - All UI text uses `t('key')` instead of hardcoded strings
  - Toggle button in top bar (🌐 EN / বাং)
  - Saved to localStorage

### 12. 🍎 Food & Barcode Scanner
- **New page**: `src/pages/FoodTracker.jsx`
- **How**:
  - Use `@zxing/browser` library for barcode scanning via camera
  - Hit Open Food Facts API (free, no key) to get nutrition data
  - Log to nutrition goal automatically
  - Manual food search fallback

---

## Build Order
```
Week 1:  Batch 1 (Streaks, Reminders, Templates)
Week 1:  Batch 2 (Challenges, Body Stats, Mood, Photos)
Week 2:  Batch 3 (Friends, AI Insights, Dashboard Widgets)
Week 2:  Batch 4 (Language, Food Scanner)
```

## New Nav Items to Add
- Challenges (Swords icon)
- Body Stats (Scale icon)  
- Food (Apple icon)
- Language toggle in header

## New DB Tables (Dexie version 4)
```js
bodyStats: '++id, date, weight, bmi, bodyFat, muscleMass',
moods:     '++id, date, score, note, timestamp',
photos:    '++id, date, type, note',
challenges:'++id, name, startDate, endDate, active',
reminders: '++id, habitCategory, times, enabled',
badges:    '++id, key, unlockedAt'
```
