import { useEffect, useRef } from 'react';
import { useTaskStore } from '../store/useTaskStore';

export const useTimer = () => {
  const { tasks } = useTaskStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const activeTasks = tasks.filter((t) => t.isRunning);

    if (activeTasks.length > 0) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          // Timer logic handled components for smoother UI
        }, 1000);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tasks]);
};
