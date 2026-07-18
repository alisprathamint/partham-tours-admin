import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Users, Save, CheckCircle, Loader2 } from 'lucide-react';

const TravelerDetailsForm = ({ leadId, paxStr, passengerDetails, onDetailsSaved }) => {
  const [details, setDetails] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Parse pax string
    const s = String(paxStr || '1');
    const adultMatch = s.match(/(\d+)\s*Adult/i);
    const childMatch = s.match(/(\d+)\s*Child/i);
    
    let adults = 1;
    let children = 0;
    
    if (adultMatch || childMatch) {
      adults = adultMatch ? parseInt(adultMatch[1]) : 0;
      children = childMatch ? parseInt(childMatch[1]) : 0;
    } else {
      adults = parseInt(s) || 1;
    }

    const total = adults + children;
    const initialDetails = [];

    for (let i = 0; i < total; i++) {
      const isChild = i >= adults;
      const existing = (passengerDetails || []).find(p => p.index === i);
      
      initialDetails.push({
        index: i,
        isChild: existing ? existing.isChild : isChild,
        name: existing?.name || '',
        gender: existing?.gender || '',
        age: existing?.age || ''
      });
    }
    
    setDetails(initialDetails);
  }, [paxStr, passengerDetails]);

  const handleUpdate = (index, field, value) => {
    setDetails(prev => prev.map(d => d.index === index ? { ...d, [field]: value } : d));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await api.put(`/crm/leads/${leadId}`, { passengerDetails: details });
      if (res.data.success) {
        setSuccess(true);
        if (onDetailsSaved) onDetailsSaved(details);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving passenger details', err);
      alert('Failed to save details');
    } finally {
      setSaving(false);
    }
  };

  if (details.length === 0) return null;

  return (
    <div className="mb-6 bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
            <Users size={12} className="text-blue-600" />
          </div>
          <p className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
            Traveler Details
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold transition-all ${
            success 
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
              : 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-800'
          }`}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : success ? <CheckCircle size={12} /> : <Save size={12} />}
          {success ? 'Saved!' : 'Save Details'}
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {details.map(d => (
          <div key={d.index} className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded border border-slate-200 shadow-sm">
            <div className="w-full sm:w-16 shrink-0 flex items-center sm:items-start sm:pt-2">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                d.isChild ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {d.isChild ? 'Child' : 'Adult'}
              </span>
            </div>
            
            <div className="flex-1 grid grid-cols-12 gap-2">
              <div className="col-span-12 sm:col-span-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={d.name}
                  onChange={e => handleUpdate(d.index, 'name', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-400 bg-slate-50 focus:bg-white transition-all font-medium placeholder-slate-400"
                />
              </div>
              <div className="col-span-4 sm:col-span-3">
                <select
                  value={d.isChild ? 'Child' : 'Adult'}
                  onChange={e => handleUpdate(d.index, 'isChild', e.target.value === 'Child')}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-400 bg-slate-50 focus:bg-white transition-all font-medium text-slate-700"
                >
                  <option value="Adult">Adult</option>
                  <option value="Child">Child</option>
                </select>
              </div>
              <div className="col-span-4 sm:col-span-3">
                <select
                  value={d.gender}
                  onChange={e => handleUpdate(d.index, 'gender', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-400 bg-slate-50 focus:bg-white transition-all font-medium text-slate-700"
                >
                  <option value="">Gender</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div className="col-span-4 sm:col-span-2">
                <input
                  type="number"
                  placeholder="Age"
                  value={d.age}
                  onChange={e => handleUpdate(d.index, 'age', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-400 bg-slate-50 focus:bg-white transition-all font-medium placeholder-slate-400"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TravelerDetailsForm;
