import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { Task, TimeEntry, Settings } from '../types';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  error?: string;
}
import { format } from 'date-fns';
import { syncTaskToMonday } from '../lib/monday';
import { parseICalForToday } from '../lib/calendar';

interface TaskState {
  tasks: Task[];
  history: TimeEntry[];
  settings: Settings;
  addTask: (name: string, description?: string) => void;
  archiveTask: (id: string) => void;
  unarchiveTask: (id: string) => void;
  deleteTaskPermanently: (id: string) => void;
  startTask: (id: string) => void;
  pauseTask: (id: string) => void;
  stopTask: (id: string) => void;
  updateTask: (id: string, name: string, description?: string) => void;
  addTimeEntry: (taskId: string, duration: number, date: string, startTime?: string, endTime?: string) => void;
  splitTask: (id: string) => void;
  clearHistory: () => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  updateSettings: (settings: Partial<Settings>) => void;
  autoArchiveTasks: (archiveDate: string, type?: 'work' | 'midnight') => void;
  toggleAllNighter: (id: string) => void;
  toggleRecurring: (id: string) => void;
  syncToMonday: () => Promise<SyncResult>;
  syncCalendarTasks: () => Promise<boolean>;
}

const electronStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // Only attempt to bridge if we are not in a pre-hydration SSR-like crash wrapper
    if (typeof window !== 'undefined' && window.electronAPI) {
      return await window.electronAPI.readStore(name);
    }
    return null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.writeStore(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    // We don't distinctly need a remove for Zustand, but you could write an empty file.
    if (typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.writeStore(name, '');
    }
  },
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      history: [],
      settings: {
        enableWorkHours: false,
        workHourStart: '09:00',
        workHourEnd: '17:00',
        autoArchiveAtEndOfDay: true,
        lastAutoArchiveDate: '',
        lastWorkArchiveDate: '',
        theme: 'slate',
        integrations: {
          monday: {
            apiKey: '',
            boardId: '',
            mappings: [],
            employeeName: ''
          },
          calendar: {
            url: '',
            autoSync: false,
          }
        }
      },
      
      addTask: (name, description) => set((state) => ({
        tasks: [
          ...state.tasks,
          {
            id: crypto.randomUUID(),
            name,
            description,
            isRunning: false,
            archived: false,
            startTime: null,
            createdAt: Date.now(),
          },
        ],
      })),

      archiveTask: (id) => set((state) => ({
        tasks: state.tasks.map((t) => 
          t.id === id ? { ...t, isRunning: false, startTime: null, archived: true } : t
        ),
      })),

      unarchiveTask: (id) => set((state) => ({
        tasks: state.tasks.map((t) => 
          t.id === id ? { ...t, archived: false } : t
        ),
      })),

      deleteTaskPermanently: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        history: state.history.filter((h) => h.taskId !== id),
      })),

      startTask: (id) => {
        const now = Date.now();
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === id) {
              return { ...t, isRunning: true, startTime: now };
            }
            if (t.isRunning) {
              // Pause other tasks and record their time
              const elapsed = Math.floor((now - (t.startTime || now)) / 1000);
              const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              if (elapsed > 0) {
                get().addTimeEntry(t.id, elapsed, format(t.startTime || now, 'yyyy-MM-dd'), formatTime(t.startTime || now), formatTime(now));
              }
              return { ...t, isRunning: false, startTime: null };
            }
            return t;
          }),
        }));
      },

      pauseTask: (id) => {
        const now = Date.now();
        const task = get().tasks.find(t => t.id === id);
        if (task && task.isRunning && task.startTime) {
          const elapsed = Math.floor((now - task.startTime) / 1000);
          const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          if (elapsed > 0) {
            get().addTimeEntry(id, elapsed, format(task.startTime, 'yyyy-MM-dd'), formatTime(task.startTime), formatTime(now));
          }
          set((state) => ({
            tasks: state.tasks.map((t) => 
              t.id === id ? { ...t, isRunning: false, startTime: null } : t
            ),
          }));
        }
      },

      stopTask: (id) => {
        get().pauseTask(id);
      },

      updateTask: (id, name, description) => set((state) => ({
        tasks: state.tasks.map((t) => 
          t.id === id ? { ...t, name, description } : t
        ),
      })),

      addTimeEntry: (taskId, duration, date, startTime, endTime) => set((state) => ({
        history: [
          ...state.history,
          {
            id: crypto.randomUUID(),
            taskId,
            duration,
            date,
            timestamp: Date.now(),
            startTime,
            endTime
          }
        ]
      })),

      splitTask: (id) => {
        const now = Date.now();
        const task = get().tasks.find(t => t.id === id);
        if (task && task.isRunning && task.startTime) {
          const endOfPrevDay = new Date(task.startTime);
          endOfPrevDay.setHours(23, 59, 59, 999);
          
          const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          const elapsedPrev = Math.floor((endOfPrevDay.getTime() - task.startTime) / 1000) + 1;
          if (elapsedPrev > 0) {
            get().addTimeEntry(id, elapsedPrev, format(task.startTime, 'yyyy-MM-dd'), formatTime(task.startTime), "23:59");
          }
          
          const midnight = new Date(now);
          midnight.setHours(0, 0, 0, 0);

          set((state) => ({
            tasks: state.tasks.map((t) => 
              t.id === id ? { ...t, startTime: midnight.getTime() } : t
            ),
          }));
        }
      },

      clearHistory: () => set({ history: [] }),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      toggleAllNighter: (id) => set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === id ? { ...t, allNighter: !t.allNighter } : t
        )
      })),

      toggleRecurring: (id) => set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === id ? { ...t, isRecurring: !t.isRecurring } : t
        )
      })),

      autoArchiveTasks: (archiveDate, type = 'midnight') => {
        const now = Date.now();
        set((state) => {
          let newTasks = [...state.tasks];
          const newHistory = [...state.history];
          
          newTasks = newTasks.map((t) => {
            if (t.archived) return t;

            // Handle tasks based on allNighter flag
            if (t.isRunning && t.startTime) {
              if (t.allNighter) return t; // Keep running
              
              const elapsed = Math.floor((now - t.startTime) / 1000);
              if (elapsed > 0) {
                newHistory.push({
                  id: crypto.randomUUID(),
                  taskId: t.id,
                  duration: elapsed,
                  date: format(t.startTime, 'yyyy-MM-dd'),
                  timestamp: now,
                });
              }
              return { ...t, isRunning: false, startTime: null, archived: true };
            }

            if (!t.allNighter) {
              return { ...t, archived: true };
            }
            return t;
          });

          // Recreate recurring tasks if they were archived
          const archivedRecurring = newTasks.filter(t => t.isRecurring && t.archived);
          archivedRecurring.forEach(t => {
            const exists = newTasks.some(existing => !existing.archived && existing.name === t.name);
            if (!exists) {
              newTasks.push({
                id: crypto.randomUUID(),
                name: t.name,
                description: t.description,
                isRunning: false,
                archived: false,
                startTime: null,
                createdAt: now,
                allNighter: t.allNighter,
                isRecurring: true,
              });
            }
          });

          return { 
            tasks: newTasks, 
            history: newHistory,
            settings: { 
              ...state.settings, 
              lastAutoArchiveDate: archiveDate,
              ...(type === 'work' ? { lastWorkArchiveDate: archiveDate } : {})
            }
          };
        });
      },

      exportData: () => {
        const data = {
          tasks: get().tasks,
          history: get().history,
          settings: get().settings,
          version: '1.0.0',
          exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
      },

      importData: (jsonData) => {
        try {
          const data = JSON.parse(jsonData);
          
          // Basic structure validation
          if (!data || typeof data !== 'object') return false;
          if (!Array.isArray(data.tasks) || !Array.isArray(data.history)) return false;

          // Validate tasks
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const validTasks = data.tasks.every((t: any) => 
            t && typeof t === 'object' &&
            typeof t.id === 'string' &&
            typeof t.name === 'string' &&
            typeof t.isRunning === 'boolean' &&
            (t.startTime === null || typeof t.startTime === 'number') &&
            typeof t.createdAt === 'number'
          );

          if (!validTasks) return false;

          // Validate history entries
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const validHistory = data.history.every((h: any) => 
            h && typeof h === 'object' &&
            typeof h.id === 'string' &&
            typeof h.taskId === 'string' &&
            typeof h.duration === 'number' &&
            typeof h.date === 'string' &&
            typeof h.timestamp === 'number'
          );

          if (!validHistory) return false;
          
          set((state) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tasks: data.tasks.map((t: any) => ({
              id: t.id,
              name: t.name,
              description: t.description || '',
              isRunning: false, // Force stop on import for safety
              archived: !!t.archived,
              startTime: null,
              createdAt: t.createdAt,
              allNighter: !!t.allNighter,
              isRecurring: !!t.isRecurring,
            })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            history: data.history.map((h: any) => ({
              id: h.id,
              taskId: h.taskId,
              duration: h.duration,
              date: h.date,
              timestamp: h.timestamp
            })),
            settings: data.settings ? { ...state.settings, ...data.settings } : state.settings
          }));
          return true;
        } catch (e) {
          console.error('Import failed:', e);
          return false;
        }
      },

      syncToMonday: async () => {
        const { settings, history } = get();
        const monday = settings.integrations?.monday;
        
        if (!monday || !monday.apiKey || !monday.boardId) {
          return { success: false, syncedCount: 0, error: 'Monday.com integration not configured' };
        }

        const unsynced = history.filter(h => !h.synced);
        if (unsynced.length === 0) return { success: true, syncedCount: 0 };

        let syncedCount = 0;
        
        const newHistory = [...history];

        for (const entry of unsynced) {
          const task = get().tasks.find(t => t.id === entry.taskId);
          if (!task) continue;

          const result = await syncTaskToMonday(
            monday.apiKey,
            monday.boardId,
            task.name,
            entry.duration,
            new Date(entry.date),
            monday.employeeName || '',
            monday.mappings,
            monday.groupId,
            entry.startTime,
            entry.endTime
          );

          if (result.success) {
            const index = newHistory.findIndex(h => h.id === entry.id);
            if (index !== -1) {
              newHistory[index] = { ...newHistory[index], synced: true };
              syncedCount++;
            }
          } else {
            set({ history: newHistory });
            return { success: false, syncedCount, error: result.error };
          }
        }

        set({ history: newHistory });
        return { success: true, syncedCount };
      },

      syncCalendarTasks: async () => {
        const { settings, tasks, addTask, updateSettings } = get();
        const calendar = settings.integrations?.calendar;
        
        if (!calendar || !calendar.url) {
          return false;
        }

        try {
          // Fetch raw iCal data securely bypassing CORS via the main process
          const icalData = await window.electronAPI.fetchCalendar(calendar.url);
          
          // Parse events looking specifically for those occurring "Today"
          const events = parseICalForToday(icalData);
          
          let tasksCreated = 0;

          events.forEach(event => {
            // Prevent duplicates: Only add if an active task with the same name doesn't exist already
            const exists = tasks.some(t => !t.archived && t.name === event.title);
            if (!exists) {
              addTask(event.title, event.description);
              tasksCreated++;
            }
          });

          // Update last sync date
          const today = new Date();
          const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          
          updateSettings({
            integrations: {
              ...settings.integrations,
              calendar: {
                ...calendar,
                lastSyncDate: todayString
              }
            }
          });

          return true;
        } catch (error) {
          console.error("Calendar Sync Failed:", error);
          return false;
        }
      }
    }),
    {
      name: 'chronos-task-storage', // name of item in the storage (must be unique)
      storage: createJSONStorage(() => electronStorage),
    }
  )
);

