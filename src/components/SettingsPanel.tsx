import { Settings as SettingsIcon, Save } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { IntegrationsPanel } from './IntegrationsPanel';

export const SettingsPanel = () => {
  const { settings, updateSettings } = useTaskStore();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel"
      style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <SettingsIcon className="text-accent-primary" size={28} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Settings</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'white' }}>Automated Archiving</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Enable Working Hours</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Enforce a strict schedule for time tracking</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={localSettings.enableWorkHours}
                onChange={(e) => setLocalSettings({ ...localSettings, enableWorkHours: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
              />
            </label>
          </div>

          {localSettings.enableWorkHours && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
               <div style={{ flex: 1 }}>
                 <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Work Start Time</label>
                 <input 
                   type="time" 
                   value={localSettings.workHourStart}
                   onChange={(e) => setLocalSettings({ ...localSettings, workHourStart: e.target.value })}
                   className="glass-input"
                   style={{ width: '100%', padding: '0.5rem' }}
                 />
               </div>
               <div style={{ flex: 1 }}>
                 <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Work End Time</label>
                 <input 
                   type="time" 
                   value={localSettings.workHourEnd}
                   onChange={(e) => setLocalSettings({ ...localSettings, workHourEnd: e.target.value })}
                   className="glass-input"
                   style={{ width: '100%', padding: '0.5rem' }}
                 />
               </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 500 }}>End of Day Auto-Archive</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                {localSettings.enableWorkHours 
                  ? "Stop and archive tasks when the workday ends." 
                  : "Stop and archive tasks at midnight."}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={localSettings.autoArchiveAtEndOfDay}
                onChange={(e) => setLocalSettings({ ...localSettings, autoArchiveAtEndOfDay: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
              />
            </label>
          </div>
        </section>

        <IntegrationsPanel />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button 
            onClick={handleSave} 
            className="btn-primary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: saved ? 'var(--accent-success, #10b981)' : 'var(--accent-primary)',
              transition: 'background 0.3s ease'
            }}
          >
            <Save size={18} />
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

