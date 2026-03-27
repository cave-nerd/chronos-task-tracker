/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    onMainMessage: (callback: (message: string) => void) => void;
    fetchCalendar: (url: string) => Promise<string>;
  }
}
