<div align="center">

# ⏱ Chronos Task Tracker

**A local-first desktop time tracker built for people who actually need to know where their day went.**

[![Release](https://img.shields.io/github/v/release/cave-nerd/chronos-task-tracker?style=flat-square&color=6366f1)](https://github.com/cave-nerd/chronos-task-tracker/releases/latest)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=flat-square&color=0ea5e9)](https://github.com/cave-nerd/chronos-task-tracker/releases/latest)
[![License: GPL v3](https://img.shields.io/badge/license-GPLv3-10b981?style=flat-square)](LICENSE)
[![Built with Electron](https://img.shields.io/badge/built%20with-Electron-47848f?style=flat-square&logo=electron)](https://www.electronjs.org/)

[Download](#-download) · [Features](#-features) · [Getting Started](#-getting-started) · [Integrations](#-integrations) · [Contributing](#-contributing)

</div>

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| ⏳ | **Live Task Timer** | Start, pause, and stop timers against named tasks in one click |
| 📊 | **Time Analytics** | Visual breakdowns of how your time is distributed across tasks |
| 🔄 | **Midnight Auto-Reset** | Active sessions automatically roll over at midnight — no lost time |
| 📅 | **Work Hours** | Configure your working hours; auto-archive tasks at end of day |
| 🏃 | **All-Nighter Mode** | Tracks sessions that span midnight without splitting the entry |
| 🔁 | **Recurring Tasks** | Mark tasks as recurring so they reappear each day automatically |
| 📤 | **Import / Export** | Back up and restore your time data as JSON |
| 🎨 | **Themes** | Choose from multiple UI themes, persisted between sessions |
| 📆 | **Calendar Subscription** | Subscribe to iCal/CalDAV calendars; today's events are automatically added as tasks |
| 🔗 | **Monday.com Sync** | Upload daily time entries directly to a Monday.com board |

---

## 📥 Download

Grab the latest release for your platform — no install needed for Linux:

| Platform | File |
|----------|------|
| 🐧 Linux | `ChronosTaskTracker-Linux-x.x.x.AppImage` |
| 🪟 Windows | `ChronosTaskTracker-Windows-x.x.x-Setup.exe` |

**[→ Latest Release](https://github.com/cave-nerd/chronos-task-tracker/releases/latest)**

### Linux
```bash
chmod +x ChronosTaskTracker-Linux-*.AppImage
./ChronosTaskTracker-Linux-*.AppImage
```

### Windows
Run the `Setup.exe` installer. Choose your install directory and you're done.

---

## 🚀 Getting Started (Development)

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- npm

### Run locally
```bash
git clone https://github.com/cave-nerd/chronos-task-tracker.git
cd chronos-task-tracker
npm install
npm run dev
```

### Build for distribution
```bash
# Linux AppImage
npm run build

# Windows installer (requires Wine on Linux, or run on Windows)
npx electron-builder --win
```

Builds are output to `release/<version>/`.

---

## 🔗 Integrations

### Monday.com

Chronos can push your daily time entries directly to a Monday.com board at the end of the day.

**Setup:**
1. Open the **Integrations** panel inside the app
2. Paste your Monday.com **API key** and **Board ID**
3. Select the **Group** you want entries posted to
4. Map Chronos fields (duration, task name, start/end time, employee) to your board's columns
5. Click **Sync to Monday.com** when you're ready to upload

> Upload is always manual — nothing is sent automatically.

### Calendar Subscription

Chronos can pull today's events from any iCal/CalDAV calendar and automatically add them as tasks.

**Setup:**
1. Open the **Integrations** panel inside the app
2. Paste one or more calendar subscription URLs (must be `http://` or `https://`)
3. Click **Sync Calendars** — today's events are added as tasks instantly

> Only HTTP and HTTPS URLs are accepted. `file://` and other schemes are blocked.

---

## 🗂 Project Structure

```
chronos-task-tracker/
├── electron/
│   ├── main.ts              # Electron main process (IPC handlers, calendar fetch)
│   ├── preload.ts           # Preload bridge
│   └── electron-env.d.ts   # Electron environment types
├── src/
│   ├── components/
│   │   ├── TaskForm.tsx           # Create / edit tasks
│   │   ├── TaskItem.tsx           # Individual task row with timer
│   │   ├── TaskList.tsx           # Task list view
│   │   ├── TimeAnalytics.tsx      # Charts and daily summaries
│   │   ├── DataManagement.tsx     # Import / export
│   │   ├── IntegrationsPanel.tsx  # Monday.com and calendar integrations
│   │   └── SettingsPanel.tsx      # App preferences and theme selection
│   ├── hooks/
│   │   ├── useMidnightReset.ts    # Daily session rollover
│   │   └── useTimer.ts            # Live timer logic
│   ├── lib/
│   │   └── monday.ts              # Monday.com API client
│   ├── store/
│   │   └── useTaskStore.ts        # Zustand global state
│   └── types/
│       └── index.ts               # Shared TypeScript types
├── build/
│   └── icon.png                   # App icon
└── electron-builder.json5         # Build configuration
```

---

## 🛠 Stack

| Layer | Technology |
|-------|-----------|
| Shell | [Electron](https://www.electronjs.org/) |
| UI | [React 18](https://react.dev/) + TypeScript |
| State | [Zustand](https://zustand-demo.pmnd.rs/) |
| Charts | [Recharts](https://recharts.org/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Build | [Vite](https://vitejs.dev/) + [electron-builder](https://www.electron.build/) |

---

## 🤝 Contributing

Issues and pull requests are welcome. For significant changes please open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

You are free to use, modify, and distribute this software under the terms of the GPLv3. Any distributed modifications must also be released under the GPLv3.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/cave-nerd">cave-nerd</a></sub>
</div>
