/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    onMainMessage: (callback: (message: string) => void) => void;
    fetchCalendar: (url: string) => Promise<string>;
    readStore: (key: string) => Promise<string | null>;
    writeStore: (key: string, value: string) => Promise<void>;
  }
}
