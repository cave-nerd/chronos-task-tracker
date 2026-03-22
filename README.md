# Chronos Task Tracker

A desktop time-tracking application for logging work hours against tasks, with Monday.com integration for uploading time entries at the end of each day.

---

## Features

- **Task Tracker** — log time against named tasks throughout the workday
- **Time Analytics** — visualize time distribution across tasks and categories
- **Data Management** — import and export time data
- **Monday.com integration** — upload daily hours directly to a Monday.com board (in progress)
- **Midnight reset** — automatic daily rollover resets the active session at midnight

---

## Stack

| Layer | Technology |
|-------|-----------|
| Shell | Electron |
| UI | React 18 + TypeScript |
| Icons | Lucide React |
| Build | Vite + electron-builder |

---

## Getting Started

```bash
npm install
npm run dev      # Development mode
npm run build    # Production build
npm run dist     # Package for distribution
```

---

## Project Structure

```
src/
  components/
    TaskForm.tsx           # Create / edit tasks
    TaskList.tsx           # Task list with time entries
    TimeAnalytics.tsx      # Charts and time summaries
    DataManagement.tsx     # Import / export
    IntegrationsPanel.tsx  # Monday.com and other integrations
    SettingsPanel.tsx      # App preferences
  hooks/
    useMidnightReset.ts    # Rolls over daily tracking at midnight
  App.tsx                  # Root layout and tab navigation
```

---

## Monday.com Integration

The **Integrations** panel allows connecting to a Monday.com workspace so time entries can be uploaded at the end of each workday. Configure your API key and board ID in the panel. Upload is triggered manually — no data is sent automatically.
