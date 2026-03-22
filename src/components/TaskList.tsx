import { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { TaskItem } from './TaskItem';
import { AnimatePresence } from 'framer-motion';
import { Archive, ArchiveRestore } from 'lucide-react';

export const TaskList = () => {
  const { tasks } = useTaskStore();
  const [showArchived, setShowArchived] = useState(false);

  const filteredTasks = tasks.filter(t => showArchived ? t.archived : !t.archived);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <button 
          onClick={() => setShowArchived(!showArchived)}
          className="btn-icon"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.5rem 1rem',
            background: showArchived ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
            borderRadius: '12px',
            color: showArchived ? 'var(--accent-primary)' : 'rgba(255,255,255,0.5)',
            fontSize: '0.9rem',
            width: 'auto'
          }}
        >
          {showArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
          {showArchived ? 'View Active' : 'View Archived'}
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div 
          className="glass-panel" 
          style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            color: 'rgba(255,255,255,0.4)',
            borderRadius: '20px'
          }}
        >
          <p>
            {showArchived 
              ? 'No archived tasks found.' 
              : 'No active tasks. Create one above to start tracking!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
