import { Share2, RefreshCw, CheckCircle2, Search, Table, Layers, Calendar } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBoardMetadata, BoardMetadata, getSampleItems } from '../lib/monday';

const READ_ONLY_TYPES = ['formula', 'lookup', 'progress', 'auto_number', 'creation_log', 'last_updated', 'pulse_id', 'mirror', 'time_tracking'];

export const IntegrationsPanel = () => {
  const { settings, updateSettings, syncToMonday, history, syncCalendarTasks } = useTaskStore();
  const [syncing, setSyncing] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [metadata, setMetadata] = useState<BoardMetadata | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; count: number; error?: string } | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [debugItems, setDebugItems] = useState<any[] | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  const monday = settings.integrations?.monday || { apiKey: '', boardId: '', mappings: [], employeeName: '' };
  const calendar = settings.integrations?.calendar || { url: '', autoSync: false };

  const handleUpdateCalendar = (field: string, value: any) => {
    updateSettings({
      integrations: {
        ...settings.integrations,
        calendar: { ...calendar, [field]: value }
      }
    });
  };

  const handleCalendarSync = async () => {
    setCalendarSyncing(true);
    await syncCalendarTasks();
    setCalendarSyncing(false);
  };

  const handleUpdateMonday = (field: string, value: any) => {
    updateSettings({
      integrations: {
        ...settings.integrations,
        monday: { ...monday, [field]: value }
      }
    });
    // Clear metadata if ID or Key changes
    if (field === 'apiKey' || field === 'boardId') {
      setMetadata(null);
      setVerifyError(null);
    }
  };

  const handleVerify = async () => {
    if (!monday.apiKey || !monday.boardId) return;
    setVerifying(true);
    setVerifyError(null);
    setMetadata(null);
    
    try {
      const result = await getBoardMetadata(monday.apiKey, monday.boardId);
      if (result.success && result.metadata) {
        setMetadata(result.metadata);
        
        // Ensure all mappings exist or add new ones discovered
        const currentMappings = monday.mappings || [];
        const newMappings = [...currentMappings];
        
        result.metadata.columns.forEach(col => {
          if (!newMappings.find(m => m.columnId === col.id)) {
             // Auto-mapping logic for new columns
             let source: 'duration' | 'date' | 'employee' | 'none' = 'none';
             const title = col.title.toLowerCase();
             
             if (['duration', 'time', 'minutes'].some(k => title.includes(k))) source = 'duration';
             else if (['date', 'completed', 'done'].some(k => title.includes(k))) source = 'date';
             else if (['employee', 'person', 'assignee'].some(k => title.includes(k))) source = 'employee';
             
             newMappings.push({ columnId: col.id, source, type: col.type });
          } else {
             // Update type for existing mappings if it changed or was missing
             const idx = newMappings.findIndex(m => m.columnId === col.id);
             newMappings[idx] = { ...newMappings[idx], type: col.type };
          }
        });
        
        handleUpdateMonday('mappings', newMappings);
      } else {
        setVerifyError(result.error || 'Failed to fetch board metadata');
      }
    } catch (err) {
      setVerifyError('An unexpected error occurred');
    } finally {
      setVerifying(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncToMonday();
      let errorMessage = result.error;
      if (errorMessage) {
        if (errorMessage.includes('auto calculated') || errorMessage.includes('can not be updated')) {
          errorMessage = "Sync Failed: One or more mapped columns are 'Read-Only' or 'Auto-Calculated' in Monday.com. Please check your mappings and remove columns like Formula or Progress Tracking.";
        }
      }
      setSyncResult({ success: result.success, count: result.syncedCount, error: errorMessage });
    } catch (err) {
      setSyncResult({ success: false, count: 0, error: 'Sync failed unexpectedly' });
    } finally {
      setSyncing(false);
    }
  };

  const updateMapping = (columnId: string, updates: Partial<typeof monday.mappings[0]>) => {
    const newMappings = (monday.mappings || []).map(m => 
      m.columnId === columnId ? { ...m, ...updates } : m
    );
    handleUpdateMonday('mappings', newMappings);
  };

  const handleDebug = async () => {
    if (!monday.apiKey || !monday.boardId) return;
    setDebugLoading(true);
    try {
      const items = await getSampleItems(monday.apiKey, monday.boardId, monday.groupId);
      setDebugItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setDebugLoading(false);
    }
  };

  const unsyncedCount = history.filter(h => !h.synced).length;

  return (
    <section className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Share2 aria-hidden="true" className="text-accent-primary" size={24} />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>External Integrations</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <img src="https://monday.com/favicon.ico" alt="Monday" style={{ width: '16px', height: '16px' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Monday.com</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="monday-api-key" style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>API Key</label>
              <input
                id="monday-api-key"
                type="password"
                value={monday.apiKey}
                onChange={(e) => handleUpdateMonday('apiKey', e.target.value)}
                placeholder="Paste your API key"
                className="glass-input"
                style={{ width: '100%', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'flex-end' }}>
              <div>
                <label htmlFor="monday-board-id" style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>Board ID</label>
                <input
                  id="monday-board-id"
                  type="text"
                  value={monday.boardId}
                  onChange={(e) => handleUpdateMonday('boardId', e.target.value)}
                  placeholder="e.g. 123456789"
                  className="glass-input"
                  style={{ width: '100%', fontSize: '0.9rem' }}
                />
              </div>
              <button
                onClick={handleVerify}
                disabled={verifying || !monday.apiKey || !monday.boardId}
                aria-busy={verifying}
                className="btn-secondary"
                style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Search size={14} aria-hidden="true" className={verifying ? 'animate-spin' : ''} />
                {verifying ? 'Verifying...' : 'Verify Board'}
              </button>
            </div>

            <AnimatePresence>
              {verifyError && (
                <motion.div role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                  {verifyError}
                </motion.div>
              )}

              {metadata && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}
                >
                  <div role="status" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={14} aria-hidden="true" />
                    Connected to: {metadata.name}
                  </div>

                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Table size={12} aria-hidden="true" /> COLUMN MAPPING TABLE
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {metadata.columns
                      .filter(col => !READ_ONLY_TYPES.includes(col.type))
                      .map(col => {
                        const mapping = (monday.mappings || []).find(m => m.columnId === col.id) || { columnId: col.id, source: 'none' };
                        
                        return (
                          <div key={col.id} style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1.2fr 1fr 1.5fr', 
                            gap: '0.75rem', 
                            alignItems: 'center',
                            padding: '0.5rem',
                            background: mapping.source !== 'none' ? 'rgba(var(--accent-primary-rgb), 0.05)' : 'transparent',
                            borderRadius: '6px',
                            border: mapping.source !== 'none' ? '1px solid rgba(var(--accent-primary-rgb), 0.1)' : '1px solid transparent'
                          }}>
                            <div style={{ fontSize: '0.8rem' }}>
                              <div style={{ fontWeight: 600 }}>{col.title}</div>
                              <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{col.type} ({col.id})</div>
                            </div>
                            
                            <select
                              value={mapping.source}
                              onChange={(e) => updateMapping(col.id, { source: e.target.value as any })}
                              aria-label={`Data source for ${col.title} column`}
                              className="glass-input"
                              style={{ width: '100%', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                            >
                              <option value="none">None</option>
                              <option value="duration">Duration (Min)</option>
                              <option value="duration_h">Duration (Hours)</option>
                              <option value="date">Date</option>
                              <option value="employee">Employee</option>
                              <option value="task_name">Task Name</option>
                              <option value="start_time">Start Time</option>
                              <option value="end_time">End Time</option>
                              <option value="static">Static Value</option>
                            </select>

                            <div style={{ flex: 1 }}>
                              {mapping.source === 'employee' && (
                                <input
                                  type="text"
                                  value={monday.employeeName || ''}
                                  onChange={(e) => handleUpdateMonday('employeeName', e.target.value)}
                                  placeholder="Global Name"
                                  aria-label="Employee name for sync"
                                  className="glass-input"
                                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                                />
                              )}
                              {mapping.source === 'static' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <input
                                      list={`options-${col.id}`}
                                      type="text"
                                      value={mapping.staticValue || ''}
                                      onChange={(e) => updateMapping(col.id, { staticValue: e.target.value })}
                                      placeholder="Value or Search..."
                                      aria-label={`Static value for ${col.title}`}
                                      className="glass-input"
                                      style={{ flex: 1, fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                                    />
                                    <datalist id={`options-${col.id}`}>
                                      {(col.options || []).map(opt => <option key={opt} value={opt} />)}
                                      {(mapping.localOptions || []).map(opt => <option key={`local-${opt}`} value={opt} />)}
                                    </datalist>

                                    {mapping.staticValue &&
                                     !(col.options || []).includes(mapping.staticValue) &&
                                     !(mapping.localOptions || []).includes(mapping.staticValue) && (
                                      <button
                                        onClick={() => {
                                          const currentLocal = mapping.localOptions || [];
                                          updateMapping(col.id, { localOptions: [...currentLocal, mapping.staticValue!] });
                                        }}
                                        className="btn-secondary"
                                        aria-label={`Save "${mapping.staticValue}" to list`}
                                        style={{ padding: '0 0.5rem', fontSize: '0.7rem', height: '28px' }}
                                      >
                                        + Save
                                      </button>
                                    )}
                                  </div>

                                  {(mapping.localOptions && mapping.localOptions.length > 0) && (
                                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                      {mapping.localOptions.map(opt => (
                                        <span
                                          key={opt}
                                          style={{
                                            fontSize: '0.65rem',
                                            padding: '1px 6px',
                                            background: 'rgba(255,255,255,0.1)',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                          }}
                                        >
                                          {opt}
                                          <button
                                            onClick={() => {
                                              const newLocal = mapping.localOptions!.filter(o => o !== opt);
                                              updateMapping(col.id, { localOptions: newLocal });
                                            }}
                                            aria-label={`Remove "${opt}" from list`}
                                            style={{ border: 'none', background: 'none', color: 'rgba(255,255,255,0.4)', padding: 0, cursor: 'pointer', fontSize: '0.8rem' }}
                                          >
                                            &times;
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Layers size={12} aria-hidden="true" /> TARGET GROUP
                    </div>
                    <div role="radiogroup" aria-label="Target group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                      {metadata.groups.map(group => (
                        <button
                          key={group.id}
                          role="radio"
                          aria-checked={monday.groupId === group.id}
                          onClick={() => handleUpdateMonday('groupId', group.id)}
                          style={{
                            padding: '0.5rem',
                            fontSize: '0.75rem',
                            background: monday.groupId === group.id ? 'rgba(var(--accent-primary-rgb), 0.2)' : 'rgba(255,255,255,0.02)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            border: monday.groupId === group.id ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                            color: 'white'
                          }}
                        >
                          {group.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div aria-label={`${unsyncedCount} unsynced entries`} style={{ fontSize: '0.85rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Unsynced: </span>
                <span style={{ fontWeight: 600, color: unsyncedCount > 0 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.4)' }}>{unsyncedCount}</span>
              </div>

              <button
                onClick={handleSync}
                disabled={syncing || !monday.apiKey || !monday.boardId}
                aria-busy={syncing}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
              >
                <RefreshCw size={16} aria-hidden="true" className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync to Monday'}
              </button>
            </div>

            {syncResult && (
              <motion.div
                role="alert"
                aria-live="assertive"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  background: syncResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: syncResult.success ? '#10b981' : '#ef4444',
                  border: `1px solid ${syncResult.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                }}
              >
                <div style={{ fontWeight: 600 }}>{syncResult.success ? 'Sync Successful' : 'Sync Failed'}</div>
                <div>{syncResult.success ? `Uploaded ${syncResult.count} tasks.` : syncResult.error}</div>
              </motion.div>
            )}

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <button
                onClick={handleDebug}
                disabled={debugLoading || !monday.apiKey || !monday.boardId}
                aria-busy={debugLoading}
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Search size={14} aria-hidden="true" className={debugLoading ? 'animate-spin' : ''} />
                {debugLoading ? 'Inspecting...' : 'Debug Board Data (Inspect Column Formats)'}
              </button>

              <AnimatePresence>
                {debugItems && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ marginTop: '1rem', overflow: 'hidden' }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>
                      RAW ITEM DATA (Latest 3 Items)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                      {debugItems.map((item: any) => (
                        <div key={item.id} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.4rem' }}>{item.name} (ID: {item.id})</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {item.column_values.map((cv: any) => (
                              <div key={cv.id} style={{ fontSize: '0.7rem' }}>
                                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{cv.id}:</span>
                                <span style={{ opacity: 0.6, marginLeft: '0.3rem' }}>[{cv.type}]</span>
                                <div style={{ marginLeft: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.2rem 0.4rem', borderRadius: '4px', wordBreak: 'break-all' }}>
                                  <div style={{ opacity: 0.5 }}>Text: {cv.text || 'null'}</div>
                                  <div style={{ color: '#fbbf24' }}>Value: {cv.value || '{}'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setDebugItems(null)}
                      className="btn-secondary"
                      style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.7rem' }}
                    >
                      Close Diagnostics
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Calendar aria-hidden="true" className="text-accent-secondary" size={24} />
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'white' }}>Calendar Integration</h2>
        </div>
        
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
          Provide an iCal Subscription URL (Google Calendar, Outlook, Apple Calendar) to automatically create tasks for events scheduled today.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="ical-url" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>iCal Subscription URL (*.ics)</label>
            <input
              id="ical-url"
              type="text"
              placeholder="https://..."
              value={calendar.url}
              onChange={(e) => handleUpdateCalendar('url', e.target.value)}
              className="glass-input"
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <div>
              <label htmlFor="auto-sync-daily" style={{ fontWeight: 500, color: 'white', fontSize: '0.9rem', display: 'block', cursor: 'pointer' }}>Auto-Sync Daily</label>
              <div id="auto-sync-daily-desc" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Automatically fetch events when the application starts</div>
            </div>
            <input
              id="auto-sync-daily"
              type="checkbox"
              checked={calendar.autoSync}
              onChange={(e) => handleUpdateCalendar('autoSync', e.target.checked)}
              aria-describedby="auto-sync-daily-desc"
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-secondary)', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span aria-live="polite" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              {calendar.lastSyncDate ? `Last synced: ${calendar.lastSyncDate}` : 'Never synced'}
            </span>
            <button
              onClick={handleCalendarSync}
              disabled={calendarSyncing || !calendar.url}
              aria-busy={calendarSyncing}
              className="btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={14} aria-hidden="true" className={calendarSyncing ? 'animate-spin' : ''} />
              {calendarSyncing ? 'Syncing...' : 'Sync Events for Today'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};


