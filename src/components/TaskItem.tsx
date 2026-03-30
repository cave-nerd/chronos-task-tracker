import { useState, useEffect } from 'react';
import { Play, Pause, Square, Trash2, Edit2, Check, X, Moon, Repeat } from 'lucide-react';
import { Task } from '../types';
import { useTaskStore } from '../store/useTaskStore';
import { formatTime } from '../utils/time';
import { motion } from 'framer-motion';

interface TaskItemProps {
  task: Task;
}

export const TaskItem = ({ task }: TaskItemProps) => {
  const { startTask, pauseTask, stopTask, archiveTask, updateTask, history, toggleAllNighter, toggleRecurring } = useTaskStore();
  
  const taskHistory = history.filter(h => h.taskId === task.id);
  const accumulatedTime = taskHistory.reduce((acc, h) => acc + h.duration, 0);
  
  const [displayTime, setDisplayTime] = useState(accumulatedTime);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [editDescription, setEditDescription] = useState(task.description || '');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (task.isRunning && task.startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - task.startTime!) / 1000);
        setDisplayTime(accumulatedTime + elapsed);
      }, 1000);
    } else {
      setDisplayTime(accumulatedTime);
    }

    return () => clearInterval(interval);
  }, [task.isRunning, task.startTime, accumulatedTime]);

  // ... rest of the component remains similar but use resetTask was removed from store
  const handleSave = () => {
    updateTask(task.id, editName, editDescription);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(task.name);
    setEditDescription(task.description || '');
    setIsEditing(false);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-panel card"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', marginBottom: '1rem' }}
    >
      <div style={{ flex: 1, marginRight: '1rem' }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor={`edit-name-${task.id}`} style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>Task name</label>
            <input
              id={`edit-name-${task.id}`}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="glass-input"
              style={{ padding: '4px 8px', fontSize: '1rem', width: '100%' }}
              autoFocus
            />
            <label htmlFor={`edit-desc-${task.id}`} style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>Description</label>
            <input
              id={`edit-desc-${task.id}`}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="glass-input"
              style={{ padding: '4px 8px', fontSize: '0.8rem', width: '100%' }}
              placeholder="Description"
            />
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>{task.name}</h3>
            {task.description && (
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                {task.description}
              </p>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {!isEditing && (
          <div
            aria-label={`Elapsed time: ${formatTime(displayTime)}`}
            aria-live="off"
            style={{
              fontFamily: 'monospace',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: task.isRunning ? 'var(--accent-primary)' : 'white',
              textShadow: task.isRunning ? '0 0 10px rgba(56, 189, 248, 0.4)' : 'none',
              minWidth: '85px',
              textAlign: 'right'
            }}
          >
            {formatTime(displayTime)}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isEditing ? (
            <>
              <button aria-label="Save changes" className="btn-icon" style={{ color: 'var(--accent-success)' }} onClick={handleSave}>
                <Check size={18} aria-hidden="true" />
              </button>
              <button aria-label="Cancel editing" className="btn-icon" style={{ color: 'var(--accent-danger)' }} onClick={handleCancel}>
                <X size={18} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              {!task.isRunning ? (
                <button aria-label={`Start ${task.name}`} className="btn-icon" onClick={() => startTask(task.id)}>
                  <Play size={18} aria-hidden="true" fill="currentColor" />
                </button>
              ) : (
                <button aria-label={`Pause ${task.name}`} className="btn-icon" onClick={() => pauseTask(task.id)}>
                  <Pause size={18} aria-hidden="true" fill="currentColor" />
                </button>
              )}

              <button aria-label={`Stop ${task.name}`} className="btn-icon" onClick={() => stopTask(task.id)}>
                <Square size={18} aria-hidden="true" fill="currentColor" />
              </button>

              <button aria-label={`Edit ${task.name}`} className="btn-icon" onClick={() => setIsEditing(true)}>
                <Edit2 size={18} aria-hidden="true" />
              </button>

              <div aria-hidden="true" style={{ width: '1px', background: 'rgba(255,255,255,0.1)', height: '24px', margin: '0 4px' }} />

              <button
                className="btn-icon"
                aria-label={task.allNighter ? 'Disable all-nighter mode' : 'Enable all-nighter mode (prevent auto-archive)'}
                aria-pressed={task.allNighter}
                style={{ color: task.allNighter ? 'var(--accent-warning, #f59e0b)' : 'rgba(255,255,255,0.3)' }}
                onClick={() => toggleAllNighter(task.id)}
              >
                <Moon size={18} aria-hidden="true" />
              </button>

              <button
                className="btn-icon"
                aria-label={task.isRecurring ? 'Disable recurring task' : 'Enable recurring task (regenerate daily)'}
                aria-pressed={task.isRecurring}
                style={{ color: task.isRecurring ? 'var(--accent-primary)' : 'rgba(255,255,255,0.3)' }}
                onClick={() => toggleRecurring(task.id)}
              >
                <Repeat size={18} aria-hidden="true" />
              </button>

              <div aria-hidden="true" style={{ width: '1px', background: 'rgba(255,255,255,0.1)', height: '24px', margin: '0 4px' }} />

              <button
                className="btn-icon"
                aria-label={`Archive ${task.name}`}
                style={{ color: 'var(--accent-danger)' }}
                onClick={() => archiveTask(task.id)}
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
