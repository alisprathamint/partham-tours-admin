import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, Bell, User, Phone, CheckCircle2 } from 'lucide-react';

const FollowUpModal = ({ isOpen, onClose, lead, token, onFollowUpSaved }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const [formData, setFormData] = useState({
    activityType: 'Call',
    callDirection: 'Outgoing',
    outcome: 'Answered',
    nextAction: 'Call Back',
    datePreset: 'Today',
    followUpDate: new Date().toISOString().split('T')[0],
    followUpTime: '17:00',
    assignedToId: lead?.assignedToId || '',
    customerType: lead?.leadCategory || 'B2C',
    details: '',
    isCompleted: false,
    reminderMinutes: 15
  });

  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await res.json();
        if (data.success) {
          setUsers(data.data || []);
        }
      } catch (err) {
        console.error('FollowUpModal fetch users error:', err);
      }
    };
    if (token) fetchUsers();
  }, [token]);

  if (!isOpen || !lead) return null;

  const handleDatePreset = (preset) => {
    const date = new Date();
    if (preset === 'Tomorrow') date.setDate(date.getDate() + 1);
    else if (preset === 'In 2 days') date.setDate(date.getDate() + 2);
    else if (preset === 'In 3 days') date.setDate(date.getDate() + 3);
    
    setFormData(prev => ({
      ...prev,
      datePreset: preset,
      followUpDate: preset !== 'Custom' ? date.toISOString().split('T')[0] : prev.followUpDate
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/crm/leads/${lead.id}/follow-up`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        onFollowUpSaved();
        onClose();
      } else {
        alert('Failed to save follow up');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving follow up');
    }
  };

  // Helper for rendering sleek segmented toggle buttons
  const SegmentedControl = ({ options, value, onChange }) => (
    <div className="flex bg-slate-100 p-0.5 rounded-lg w-max border border-slate-200">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
            value === opt 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm overflow-y-auto flex p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl m-auto flex flex-col overflow-hidden animate-slide-in-up relative z-[10000]">
        
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="text-blue-600" size={16} />
              Log Follow-Up
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1 rounded-full transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-4 max-h-[75vh]">
          <form id="followUpForm" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Lead Info Banner */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 flex flex-wrap gap-x-4 gap-y-1.5 items-center">
              <div className="flex items-center gap-1.5 text-slate-700 text-xs">
                <User size={12} className="text-blue-500" />
                <span className="font-medium">{lead.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 text-xs">
                <Phone size={12} className="text-blue-500" />
                <span>{lead.phone}</span>
              </div>
              <div className="ml-auto">
                <span className="text-[9px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                  {formData.customerType} Lead
                </span>
              </div>
            </div>

            {/* Interaction Details */}
            <div>
              <h3 className="text-[10px] font-semibold text-slate-800 mb-2 uppercase tracking-wide border-b border-slate-100 pb-1">Interaction Details</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Type</label>
                  <SegmentedControl 
                    options={['Call', 'To Do']} 
                    value={formData.activityType} 
                    onChange={val => setFormData({...formData, activityType: val})} 
                  />
                </div>

                {formData.activityType === 'Call' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Direction</label>
                    <SegmentedControl 
                      options={['Outgoing', 'Incoming']} 
                      value={formData.callDirection} 
                      onChange={val => setFormData({...formData, callDirection: val})} 
                    />
                  </div>
                )}

                <div className="space-y-1 w-full">
                  <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Outcome</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Answered', 'Unanswered', 'Not Reachable'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData({...formData, outcome: opt})}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          formData.outcome === opt 
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <h3 className="text-[10px] font-semibold text-slate-800 mb-2 uppercase tracking-wide border-b border-slate-100 pb-1">Next Steps</h3>
              <div className="space-y-3">
                
                <div className="space-y-1">
                  <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Action Required</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Call Back', 'To Do', 'Meeting', 'Create Query', 'Send Quotation', 'Lost'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData({...formData, nextAction: opt})}
                        className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                          formData.nextAction === opt 
                            ? 'bg-slate-800 border-slate-800 text-white font-medium shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.nextAction !== 'Create Query' && formData.nextAction !== 'Lost' && (
                  <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Schedule For</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Today', 'Tomorrow', 'In 2 days', 'In 3 days', 'Custom'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleDatePreset(opt)}
                            className={`px-2.5 py-0.5 text-xs rounded-full transition-colors border ${
                              formData.datePreset === opt 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm font-medium' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5 items-end pt-1">
                      {formData.datePreset === 'Custom' && (
                        <div className="w-28">
                          <label className="block text-[9px] font-medium text-slate-500 uppercase mb-0.5 flex items-center gap-1"><Calendar size={10}/> Date</label>
                          <input 
                            type="date" 
                            value={formData.followUpDate}
                            onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
                          />
                        </div>
                      )}
                      <div className="w-24">
                        <label className="block text-[9px] font-medium text-slate-500 uppercase mb-0.5 flex items-center gap-1"><Clock size={10}/> Time</label>
                        <input 
                          type="time" 
                          value={formData.followUpTime}
                          onChange={(e) => setFormData({...formData, followUpTime: e.target.value})}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div className="w-36">
                        <label className="block text-[9px] font-medium text-slate-500 uppercase mb-0.5 flex items-center gap-1"><Bell size={10}/> Reminder</label>
                        <div className="flex items-center">
                          <input 
                            type="number" 
                            value={formData.reminderMinutes}
                            onChange={(e) => setFormData({...formData, reminderMinutes: e.target.value})}
                            className="w-10 border border-slate-300 rounded-l px-1 py-1 text-xs focus:outline-none focus:border-blue-500 text-center bg-white"
                          />
                          <div className="bg-slate-100 border-y border-r border-slate-300 rounded-r px-1.5 py-1 text-xs text-slate-600 font-medium">
                            mins before
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Remarks and Assignment */}
            <div>
              <h3 className="text-[10px] font-semibold text-slate-800 mb-2 uppercase tracking-wide border-b border-slate-100 pb-1">Remarks & Assignment</h3>
              <div className="space-y-2.5">
                <div>
                  <textarea 
                    rows="2"
                    placeholder="Enter discussion details..."
                    value={formData.details}
                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 resize-none bg-white"
                  ></textarea>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 px-2.5 py-2 rounded border border-slate-200">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Assign To:</label>
                    <select 
                      value={formData.assignedToId}
                      onChange={(e) => setFormData({...formData, assignedToId: e.target.value})}
                      className="border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.isCompleted}
                      onChange={(e) => setFormData({...formData, isCompleted: e.target.checked})}
                      className="w-3 h-3 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Mark as Completed</span>
                  </label>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 flex-shrink-0 rounded-b-xl relative z-[10000]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="followUpForm"
            className="px-4 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            Save Follow-Up
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default FollowUpModal;
