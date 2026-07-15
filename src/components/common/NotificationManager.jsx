import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Phone, X, Clock, RotateCcw, CheckCircle2, AlarmClock, ChevronDown, MapPin, MessageSquare } from 'lucide-react';
import api from '../../api/axios';
import { useWebSocket } from '../../context/WebSocketContext';

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return `Today at ${formatTime(dateStr)}`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' · ' + formatTime(dateStr);
};

const avatarColor = (name = '') => {
  const colors = [
    ['#EDE9FE', '#7C3AED'], // violet
    ['#DBEAFE', '#1D4ED8'], // blue
    ['#D1FAE5', '#059669'], // green
    ['#FEE2E2', '#DC2626'], // red
    ['#FEF3C7', '#D97706'], // amber
    ['#FCE7F3', '#BE185D'], // pink
  ];
  const idx = (name.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
};

// ─── Reschedule mini-form ────────────────────────────────────────────────────
const ReschedulePanel = ({ onConfirm, onCancel }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const d = new Date(Date.now() + 30 * 60000);
    return d.toTimeString().slice(0, 5);
  });
  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
      <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Set New Time</p>
      <div className="flex gap-2">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 bg-white" />
        <input type="time" value={time} onChange={e => setTime(e.target.value)}
          className="w-24 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 bg-white" />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onCancel} className="text-xs text-slate-700 hover:text-slate-700 font-medium px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          Cancel
        </button>
        <button onClick={() => onConfirm(date, time)}
          className="text-xs bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 font-semibold transition-colors shadow-sm">
          Confirm
        </button>
      </div>
    </div>
  );
};

// ─── Single reminder card ────────────────────────────────────────────────────
const ReminderCard = ({ task, onDismiss }) => {
  const [showReschedule, setShowReschedule] = useState(false);
  const [snoozingFor, setSnoozingFor] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [bgColor, textColor] = avatarColor(task.lead?.name);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await api.put(`/crm/tasks/${task.taskId}/complete`);
      setIsDone(true);
      setTimeout(() => onDismiss(task.taskId), 1500);
    } catch {
      setIsCompleting(false);
    }
  };

  const handleSnooze = async (minutes) => {
    setSnoozingFor(minutes);
    setShowSnoozeOptions(false);
    try {
      await api.put(`/crm/tasks/${task.taskId}/snooze`, { minutes });
      setTimeout(() => onDismiss(task.taskId), 600);
    } catch {
      setSnoozingFor(null);
    }
  };

  const handleReschedule = async (date, time) => {
    try {
      await api.put(`/crm/tasks/${task.taskId}/reschedule`, { dueDate: date, dueTime: time });
      onDismiss(task.taskId);
    } catch (err) {
      console.error(err);
    }
  };

  if (isDone) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 shadow-lg">
        <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
        <p className="text-sm font-semibold text-emerald-700">Follow-up marked as done!</p>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-slate-100 overflow-visible w-80"
      style={{ animation: 'slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      {/* Gradient accent top-bar */}
      <div className="h-[3px] rounded-t-2xl bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500" />

      <div className="p-4">

        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
              <Bell size={14} className="text-violet-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Follow-up Reminder</span>
          </div>
          <button onClick={() => onDismiss(task.taskId)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-slate-800 hover:bg-slate-100 transition-all">
            <X size={14} />
          </button>
        </div>

        {/* Task title */}
        <p className="text-[15px] font-bold text-slate-800 mb-3 leading-snug">{task.title}</p>

        {/* Customer card */}
        {task.lead && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{ background: bgColor, color: textColor }}
            >
              {task.lead.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{task.lead.name}</p>
              {task.lead.phone && (
                <p className="text-xs text-slate-700 truncate">{task.lead.phone}</p>
              )}
              {task.lead.destination && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={9} className="text-slate-800 flex-shrink-0" />
                  <p className="text-[10px] text-slate-800 truncate">{task.lead.destination}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Follow-up note */}
        {task.note && (
          <div className="flex gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3">
            <MessageSquare size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">{task.note}</p>
          </div>
        )}

        {/* Scheduled time */}
        <div className="flex items-center gap-1.5 mb-4">
          <Clock size={11} className="text-slate-800" />
          <p className="text-[11px] text-slate-700">
            Scheduled: <span className="font-semibold text-slate-700">{formatDate(task.dueDate)}</span>
          </p>
        </div>

        {/* Reschedule form */}
        {showReschedule && (
          <ReschedulePanel onConfirm={handleReschedule} onCancel={() => setShowReschedule(false)} />
        )}

        {/* Action buttons */}
        {!showReschedule && (
          <div className="space-y-2">
            {/* Primary: Call + Done */}
            <div className="flex gap-2">
              <button
                onClick={() => task.lead?.phone && window.open(`tel:${task.lead.phone}`, '_self')}
                disabled={!task.lead?.phone}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl py-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-emerald-200"
              >
                <Phone size={12} />
                Call Now
              </button>
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl py-2.5 transition-all shadow-sm shadow-blue-200"
              >
                <CheckCircle2 size={12} />
                {isCompleting ? 'Saving…' : 'Mark Done'}
              </button>
            </div>

            {/* Secondary: Snooze + Reschedule */}
            <div className="flex gap-2">
              {/* Snooze dropdown */}
              <div className="relative flex-1">
                <button
                  onClick={() => setShowSnoozeOptions(v => !v)}
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-semibold rounded-xl py-2 transition-all"
                >
                  <AlarmClock size={12} />
                  {snoozingFor ? `Snoozed ${snoozingFor}m` : 'Snooze'}
                  <ChevronDown size={11} className={`transition-transform ${showSnoozeOptions ? 'rotate-180' : ''}`} />
                </button>
                {showSnoozeOptions && (
                  <div className="absolute top-full mt-1.5 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                    {[5, 10, 15, 30, 60].map(m => (
                      <button key={m} onClick={() => handleSnooze(m)}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors font-medium">
                        {m >= 60 ? '1 hour' : `${m} minutes`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowReschedule(true)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-semibold rounded-xl py-2 transition-all"
              >
                <RotateCcw size={12} />
                Reschedule
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main container ──────────────────────────────────────────────────────────
const NotificationManager = () => {
  const { subscribe } = useWebSocket();
  const [reminders, setReminders] = useState([]);
  const shownTaskIdsRef = useRef(new Set());

  const addReminder = useCallback((taskData) => {
    if (shownTaskIdsRef.current.has(taskData.taskId)) return;
    shownTaskIdsRef.current.add(taskData.taskId);
    setReminders(prev => [...prev, taskData]);
  }, []);

  const dismissReminder = useCallback((taskId) => {
    setReminders(prev => prev.filter(r => r.taskId !== taskId));
  }, []);

  useEffect(() => {
    const unsub = subscribe('follow-up-reminder', addReminder);
    return unsub;
  }, [subscribe, addReminder]);

  if (reminders.length === 0) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(120%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)   scale(1);   }
        }
      `}</style>
      <div
        style={{ zIndex: 999999 }}
        className="fixed top-5 right-5 flex flex-col gap-3 pointer-events-none"
      >
        {reminders.map(task => (
          <div key={task.taskId} className="pointer-events-auto">
            <ReminderCard task={task} onDismiss={dismissReminder} />
          </div>
        ))}
      </div>
    </>,
    document.body
  );
};

export default NotificationManager;
