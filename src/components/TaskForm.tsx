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
      className="glass-panel" 
      style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      <div style={{ display: 'flex', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Task Name (e.g., UI Design)" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1 }}
          required
        />
        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Task
        </button>
      </div>
      <input 
        type="text" 
        placeholder="Description (Optional)" 
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
    </form>
  );
};
