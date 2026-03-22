import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { TimeAnalytics } from './components/TimeAnalytics';
import { DataManagement } from './components/DataManagement';
import { SettingsPanel } from './components/SettingsPanel';
import { Layout, BarChart2, Database, Clock, Settings } from 'lucide-react';
import { useMidnightReset } from './hooks/useMidnightReset';
import { useState } from 'react';

type Tab = 'tracker' | 'analytics' | 'management' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('tracker');
  useMidnightReset();

  return (
    <div 
      className="glass-panel" 
      style={{ 
        width: '100%',
        maxWidth: '1200px', 
        height: '100%',
        maxHeight: '800px',
        display: 'flex', 
        overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Sidebar */}
      <div 
        style={{ 
          width: '80px', 
          background: 'rgba(255,255,255,0.02)', 
          borderRight: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem 0',
          gap: '2rem'
        }}
      >
        <div style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>
          <Clock size={32} />
        </div>
        
        <button 
          title="Task Tracker"
          className="btn-icon" 
          onClick={() => setActiveTab('tracker')}
          style={{ 
            background: activeTab === 'tracker' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            color: activeTab === 'tracker' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.5)',
            border: activeTab === 'tracker' ? '1px solid var(--accent-primary)' : '1px solid transparent'
          }}
        >
          <Layout size={24} />
        </button>

        <button 
          title="Analytics"
          className="btn-icon" 
          onClick={() => setActiveTab('analytics')}
          style={{ 
            background: activeTab === 'analytics' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            color: activeTab === 'analytics' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.5)',
            border: activeTab === 'analytics' ? '1px solid var(--accent-primary)' : '1px solid transparent'
          }}
        >
          <BarChart2 size={24} />
        </button>

        <button 
          title="Data Management"
          className="btn-icon" 
          onClick={() => setActiveTab('management')}
          style={{ 
            background: activeTab === 'management' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            color: activeTab === 'management' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.5)',
            border: activeTab === 'management' ? '1px solid var(--accent-primary)' : '1px solid transparent'
          }}
        >
          <Database size={24} />
        </button>

        <button 
          title="Settings"
          className="btn-icon" 
          onClick={() => setActiveTab('settings')}
          style={{ 
            marginTop: 'auto',
            background: activeTab === 'settings' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            color: activeTab === 'settings' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.5)',
            border: activeTab === 'settings' ? '1px solid var(--accent-primary)' : '1px solid transparent'
          }}
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Chronos <span style={{ color: 'var(--accent-primary)' }}>Task Tracker</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
            Precision time management for Linux & Windows
          </p>
        </header>

        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {activeTab === 'tracker' ? (
            <>
              <TaskForm />
              <TaskList />
            </>
          ) : activeTab === 'analytics' ? (
            <TimeAnalytics />
          ) : activeTab === 'management' ? (
            <DataManagement />
          ) : (
            <SettingsPanel />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
