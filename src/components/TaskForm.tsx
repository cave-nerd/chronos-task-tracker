import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export const TaskForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { addTask } = useTaskStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addTask(name, description);
    setName('');
    setDescription('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Add new task"
      className="glass-panel"
      style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      <div style={{ display: 'flex', gap: '1rem' }}>
        <label htmlFor="new-task-name" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>Task name</label>
        <input
          id="new-task-name"
          type="text"
          placeholder="Task Name (e.g., UI Design)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1 }}
          required
        />
        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} aria-hidden="true" /> Add Task
        </button>
      </div>
      <label htmlFor="new-task-description" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>Description (optional)</label>
      <input
        id="new-task-description"
        type="text"
        placeholder="Description (Optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
    </form>
  );
};
