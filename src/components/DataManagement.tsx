import { Download, Upload, Trash2, Database } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { motion } from 'framer-motion';

export const DataManagement = () => {
  const { exportData, importData, clearHistory } = useTaskStore();

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronos_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importData(content)) {
        alert('Data imported successfully!');
      } else {
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      clearHistory();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel"
      style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Database aria-hidden="true" className="text-accent-primary" size={28} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Data Management</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'white' }}>Portability</h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>
            Export your tasks and history to a file to move your data between computers or keep a backup.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleExport} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Download size={18} aria-hidden="true" />
              Export Data
            </button>
            <label className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(255,255,255,0.1)' }}>
              <Upload size={18} aria-hidden="true" />
              Import Data
              <input type="file" accept=".json" onChange={handleImport} aria-label="Import data from JSON file" style={{ display: 'none' }} />
            </label>
          </div>
        </section>

        <section className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent-danger)' }}>Danger Zone</h2>
          <p id="danger-zone-desc" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>
            Clearing your history will remove all logged time entries permanently. Tasks will remain.
          </p>
          <button onClick={handleClearHistory} className="btn-primary" aria-describedby="danger-zone-desc" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <Trash2 size={18} aria-hidden="true" style={{ marginRight: '0.5rem' }} />
            Clear All History
          </button>
        </section>
      </div>
    </motion.div>
  );
};
