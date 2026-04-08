import { useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { isSameDay } from 'date-fns';

export const useMidnightReset = () => {
  useEffect(() => {
    const checkMidnight = () => {
      // Don't run until the store has finished reading from disk.
      // Writing settings before hydration completes would save default (empty) state
      // over the real persisted data.
      if (!useTaskStore.persist.hasHydrated()) return;

      const state = useTaskStore.getState();
      const now = Date.now();
      const nowDate = new Date(now);
      
      const todayString = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-${String(nowDate.getDate()).padStart(2, '0')}`;
      
      let shouldArchive = false;
      let archiveType: 'work' | 'midnight' | null = null;

      // 1. Work Hours Auto-Archive
      if (state.settings.enableWorkHours && state.settings.autoArchiveAtEndOfDay) {
        const [hours, minutes] = state.settings.workHourEnd.split(':').map(Number);
        const workEndTime = new Date(nowDate);
        workEndTime.setHours(hours, minutes, 0, 0);

        if (now >= workEndTime.getTime() && state.settings.lastWorkArchiveDate !== todayString) {
          shouldArchive = true;
          archiveType = 'work';
        }
      }

      // 2. Midnight Default Auto-Archive
      if (!shouldArchive && state.settings.lastAutoArchiveDate && state.settings.lastAutoArchiveDate !== todayString) {
        shouldArchive = true;
        archiveType = 'midnight';
      }

      // 3. Init or Archive
      if (!state.settings.lastAutoArchiveDate) {
        state.updateSettings({ lastAutoArchiveDate: todayString, lastWorkArchiveDate: todayString });
      } else if (shouldArchive) {
        state.autoArchiveTasks(todayString, archiveType || 'midnight');
      }

      // 4. Split Task for All Nighters
      const activeTask = useTaskStore.getState().tasks.find(t => t.isRunning);
      if (activeTask && activeTask.startTime) {
        if (!isSameDay(activeTask.startTime, now)) {
          useTaskStore.getState().splitTask(activeTask.id);
        }
      }
    };

    const interval = setInterval(checkMidnight, 60000);
    // Remove immediate checkMidnight() call, or debounce it if necessary.
    // Let's just rely on the interval to prevent excessive initial load checks.
    return () => clearInterval(interval);
  }, []);
};
