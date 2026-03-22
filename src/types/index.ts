export interface TimeEntry {
  id: string;
  taskId: string;
  duration: number; // in seconds
  date: string; // ISO string (YYYY-MM-DD)
  timestamp: number;
  synced?: boolean; // Track if this entry has been synced to external integrations
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  isRunning: boolean;
  archived?: boolean;
  startTime: number | null; // Unix timestamp
  createdAt: number;
  allNighter?: boolean;
  isRecurring?: boolean;
}

export interface Settings {
  enableWorkHours: boolean;
  workHourStart: string; // HH:mm format, e.g., "09:00"
  workHourEnd: string; // HH:mm format, e.g., "17:00"
  autoArchiveAtEndOfDay: boolean;
  lastAutoArchiveDate: string; // YYYY-MM-DD
  integrations?: {
    monday?: {
      apiKey: string;
      boardId: string;
      groupId?: string;
      mappings: Array<{
        columnId: string;
        source: 'duration' | 'date' | 'employee' | 'static' | 'none' | 'task_name' | 'start_time' | 'end_time' | 'duration_h';
        staticValue?: string;
        localOptions?: string[];
        type?: string;
      }>;
      employeeName?: string; // Still needed as a global or per-mapping? Let's keep global for now.
    };
  };
}

export interface TaskHistory {
  [taskId: string]: TimeEntry[];
}

export type TaskFilter = 'all' | 'active' | 'completed';
