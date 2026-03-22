import { useState, useMemo } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { formatTime } from '../utils/time';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  ChevronLeft, ChevronRight, Calendar, Clock, BarChart3, 
  Layers, PieChart as PieIcon
} from 'lucide-react';
import { 
  format, subDays, startOfDay, endOfDay, eachDayOfInterval, 
  isWithinInterval, startOfWeek, endOfWeek, startOfMonth, 
  endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, 
  subYears, parseISO
} from 'date-fns';
import { motion } from 'framer-motion';

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const TimeAnalytics = () => {
  const { tasks, history } = useTaskStore();
  const [range, setRange] = useState<TimeRange>('weekly');
  const [referenceDate, setReferenceDate] = useState(new Date());

  const chartData = useMemo(() => {
    let start: Date, end: Date, dateFormat: string;

    switch (range) {
      case 'daily':
        start = startOfDay(referenceDate);
        end = endOfDay(referenceDate);
        dateFormat = 'HH:00';
        break;
      case 'weekly':
        start = startOfWeek(referenceDate, { weekStartsOn: 1 });
        end = endOfWeek(referenceDate, { weekStartsOn: 1 });
        dateFormat = 'EEE';
        break;
      case 'monthly':
        start = startOfMonth(referenceDate);
        end = endOfMonth(referenceDate);
        dateFormat = 'dd';
        break;
      case 'yearly':
        start = startOfYear(referenceDate);
        end = endOfYear(referenceDate);
        dateFormat = 'MMM';
        break;
      default:
        start = startOfWeek(referenceDate);
        end = endOfWeek(referenceDate);
        dateFormat = 'EEE';
    }

    // Filter history entries within interval
    const filteredHistory = history.filter(h => {
      const entryDate = parseISO(h.date);
      return isWithinInterval(entryDate, { start, end });
    });

    // Group by range-specific key
    const grouping: Record<string, number> = {};
    
    // Initialize grouping with empty values for the range to ensure all points show on chart
    if (range === 'weekly') {
      eachDayOfInterval({ start, end }).forEach(day => {
        grouping[format(day, dateFormat)] = 0;
      });
    }

    filteredHistory.forEach(h => {
      const key = format(parseISO(h.date), dateFormat);
      grouping[key] = (grouping[key] || 0) + h.duration;
    });

    return Object.entries(grouping).map(([name, value]) => ({
      name,
      hours: Number((value / 3600).toFixed(2)),
      rawSeconds: value
    }));
  }, [history, range, referenceDate]);

  const taskBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    
    let start: Date, end: Date;
    switch (range) {
      case 'daily': start = startOfDay(referenceDate); end = endOfDay(referenceDate); break;
      case 'weekly': start = startOfWeek(referenceDate, { weekStartsOn: 1 }); end = endOfWeek(referenceDate, { weekStartsOn: 1 }); break;
      case 'monthly': start = startOfMonth(referenceDate); end = endOfMonth(referenceDate); break;
      case 'yearly': start = startOfYear(referenceDate); end = endOfYear(referenceDate); break;
    }

    history.filter(h => isWithinInterval(parseISO(h.date), { start, end })).forEach(h => {
      breakdown[h.taskId] = (breakdown[h.taskId] || 0) + h.duration;
    });

    return Object.entries(breakdown)
      .map(([taskId, duration]) => ({
        name: tasks.find(t => t.id === taskId)?.name || 'Deleted Task',
        value: duration,
        formatted: formatTime(duration)
      }))
      .sort((a, b) => b.value - a.value);
  }, [history, tasks, range, referenceDate]);

  const totalRangeSeconds = taskBreakdown.reduce((acc, curr) => acc + curr.value, 0);

  const navigateRange = (direction: 'prev' | 'next') => {
    const amount = direction === 'prev' ? -1 : 1;
    switch (range) {
      case 'daily': setReferenceDate(d => subDays(d, -amount)); break;
      case 'weekly': setReferenceDate(d => subWeeks(d, -amount)); break;
      case 'monthly': setReferenceDate(d => subMonths(d, -amount)); break;
      case 'yearly': setReferenceDate(d => subYears(d, -amount)); break;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-y-auto pr-2 custom-scrollbar">
      {/* Header & Range Selector */}
      <div className="flex items-center justify-between sticky top-0 bg-[#0f172a]/80 backdrop-blur-md z-10 py-2">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-sky-400" size={24} />
          <h2 className="text-xl font-bold text-white">Analytics</h2>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {(['daily', 'weekly', 'monthly', 'yearly'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                range === r ? 'bg-sky-500 text-white shadow-lg' : 'text-white/50 hover:text-white'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between glass-panel p-4">
        <button onClick={() => navigateRange('prev')} className="btn-icon">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 font-medium">
          <Calendar size={18} className="text-sky-400" />
          <span>
            {range === 'daily' && format(referenceDate, 'MMMM do, yyyy')}
            {range === 'weekly' && `${format(startOfWeek(referenceDate, { weekStartsOn : 1 }), 'MMM d')} - ${format(endOfWeek(referenceDate, { weekStartsOn : 1 }), 'MMM d, yyyy')}`}
            {range === 'monthly' && format(referenceDate, 'MMMM yyyy')}
            {range === 'yearly' && format(referenceDate, 'yyyy')}
          </span>
        </div>
        <button onClick={() => navigateRange('next')} className="btn-icon">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-4 flex flex-col gap-1">
          <span className="text-xs text-white/50 flex items-center gap-1">
            <Clock size={12} /> Total Time
          </span>
          <span className="text-2xl font-bold text-sky-400">{formatTime(totalRangeSeconds)}</span>
        </div>
        <div className="glass-panel p-4 flex flex-col gap-1">
          <span className="text-xs text-white/50 flex items-center gap-1">
            <Layers size={12} /> Tasks Tracked
          </span>
          <span className="text-2xl font-bold text-emerald-400">{taskBreakdown.length}</span>
        </div>
      </div>

      {/* Primary Chart */}
      <div className="glass-panel p-6 w-full" style={{ height: '350px', minHeight: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ 
                background: 'rgba(15, 23, 42, 0.9)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)'
              }}
              labelStyle={{ color: 'white', fontWeight: 'bold' }}
              itemStyle={{ color: '#38bdf8' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value} hours`, 'Time']}
            />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#38bdf8' : '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Breakdown */}
      <div className="glass-panel p-6 mb-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <PieIcon size={16} className="text-sky-400" /> Task Distribution
        </h3>
        <div className="flex flex-col gap-3">
          {taskBreakdown.length > 0 ? (
            taskBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="w-48 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / totalRangeSeconds) * 100}%` }}
                      className="h-full bg-sky-500"
                    />
                  </div>
                </div>
                <span className="text-sm font-bold text-white/80">{item.formatted}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-white/30 text-sm italic">
              No time entries for this period
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
