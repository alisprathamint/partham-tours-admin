import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, ChevronDown } from 'lucide-react';
import api from '../../api/axios';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

const LeadProfileForm = ({ lead, navigate, user }) => {
  const [adultsCount, setAdultsCount] = useState(lead.pax ? (parseInt(lead.pax) || 2) : 2);
  const [childrenAges, setChildrenAges] = useState([]);
  const [showTravelerPopup, setShowTravelerPopup] = useState(false);
  const travelerRef = useRef(null);

  const [foodPref, setFoodPref] = useState(lead.foodPreference || lead.foodPref || '');
  const [inclusions, setInclusions] = useState(lead.inclusions || []);
  const [theme, setTheme] = useState(lead.theme || []);
  const [leadSource, setLeadSource] = useState(lead.source ? lead.source.toUpperCase().trim() : '');
  const [numDays, setNumDays] = useState(lead.numDays || '');
  const [priceRange, setPriceRange] = useState(lead.priceRange || '');
  const [assignSales, setAssignSales] = useState('Self');
  const [salesUsers, setSalesUsers] = useState([]);

  let initialGoingTo = lead.destination || '';
  let initialGoingFrom = lead.origin || '';

  if (initialGoingTo.includes(' - ') && !initialGoingFrom) {
    const parts = initialGoingTo.split(' - ');
    initialGoingFrom = parts[0].trim();
    initialGoingTo = parts[1].trim();
  } else if (initialGoingTo.includes('-') && !initialGoingFrom) {
    const parts = initialGoingTo.split('-');
    initialGoingFrom = parts[0].trim();
    initialGoingTo = parts[1].trim();
  }

  const [goingTo, setGoingTo] = useState(initialGoingTo);
  const [goingFrom, setGoingFrom] = useState(initialGoingFrom);
  const [travelDate, setTravelDate] = useState(lead.travelDate ? new Date(lead.travelDate).toISOString().split('T')[0] : '');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        if (res.data.success) {
          setSalesUsers(res.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  const salesOptions = [
    { label: 'Self', value: 'Self' },
    ...salesUsers.map(u => ({ label: u.name, value: u.name }))
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (travelerRef.current && !travelerRef.current.contains(event.target)) {
        setShowTravelerPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveAndContinue = async () => {
    try {
      const payload = {
        origin: goingFrom,
        destination: goingTo,
        pax: `${adultsCount} Adults${childrenAges.length > 0 ? `, ${childrenAges.length} Children` : ''}`,
        travelDate,
        source: leadSource,
        numDays,
        priceRange,
        foodPref,
        inclusions,
        theme,
        type: 'QUERY',
        status: 'IN_PROGRESS'
      };

      if (assignSales === 'Self') {
        payload.assignedToId = user?.id;
        payload.assignedTo = user?.name;
      } else if (assignSales) {
        const selectedUser = salesUsers.find(u => u.name === assignSales);
        if (selectedUser) {
          payload.assignedToId = selectedUser.id || selectedUser._id;
          payload.assignedTo = selectedUser.name;
        }
      }

      if (lead._id || lead.id) {
        await api.put(`/crm/leads/${lead._id || lead.id}`, payload);
      } else {
        await api.post('/crm/leads', payload);
      }
      navigate('/crm/my-queries');
    } catch (err) {
      console.error('Error saving lead:', err);
      navigate('/crm/my-queries');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-6 space-y-6 font-sans">
      <div className="bg-white rounded-xl border border-slate-200 shadow-md">
        <div className="bg-slate-800 text-white font-bold text-base px-5 py-4 flex items-center shadow-inner rounded-t-xl">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-3 py-1.5 mr-4 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 border border-white/20 shadow-sm"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
            <span className="text-[13px] font-bold tracking-wide">BACK</span>
          </button>
          <div className="text-[15px] tracking-wide ml-1">
            {lead.name ? `Query Details - ${lead.name}` : 'New Query'}
          </div>
        </div>
        
        <div className="p-6 space-y-8 text-sm text-slate-900">
          <div className="border-t border-b border-slate-200 py-4 bg-slate-50/50 -mx-6 px-6">
            <div className="font-bold mb-3 text-slate-800 text-sm tracking-wide">Lead Info</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-[14px]">
              <div><span className="font-bold text-slate-700">Going From:</span> <span className="font-semibold text-slate-900 ml-1">{goingFrom || ''}</span></div>
              <div><span className="font-bold text-slate-700">Going To:</span> <span className="font-semibold text-slate-900 ml-1">{goingTo || ''}</span></div>
              <div><span className="font-bold text-slate-700">Pax:</span> <span className="font-semibold text-slate-900 ml-1">{`${adultsCount} Adults${childrenAges.length > 0 ? `, ${childrenAges.length} Children` : ''}`}</span></div>
              <div><span className="font-bold text-slate-700">Travel Date:</span> <span className="font-semibold text-slate-900 ml-1">{travelDate ? new Date(travelDate).toLocaleDateString() : 'NA'}</span></div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="font-bold text-slate-800 text-sm tracking-wide">Query Type :</span>
            <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
              <input type="radio" name="queryType" defaultChecked className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
              <span>FIT (Normal)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
              <input type="radio" name="queryType" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
              <span>GIT (Group)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5 pt-2">
            <div className="space-y-5">
              <div>
                <label className="block text-[13px] text-blue-700 font-bold mb-1.5 tracking-wide">Going From</label>
                <input type="text" value={goingFrom} onChange={(e) => setGoingFrom(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
              </div>
              <div className="relative" ref={travelerRef}>
                <label className="block text-[13px] text-blue-700 font-bold mb-1.5 tracking-wide">Travelers <span className="text-red-500">*</span></label>
                <div 
                  onClick={() => setShowTravelerPopup(!showTravelerPopup)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 bg-white cursor-pointer flex justify-between items-center shadow-sm hover:border-blue-400 transition-all"
                >
                  <span>{adultsCount} Adults {childrenAges.length > 0 ? `, ${childrenAges.length} Children` : ''}</span>
                  <ChevronDown size={16} className="text-slate-500" />
                </div>
                
                {showTravelerPopup && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="font-bold text-slate-800 text-[14px]">Adults</div>
                        <div className="text-[11px] text-slate-500 font-medium">12+ years</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))} className="w-7 h-7 flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50" disabled={adultsCount <= 1}><Minus size={14} /></button>
                        <span className="font-bold text-slate-800 w-4 text-center">{adultsCount}</span>
                        <button type="button" onClick={() => setAdultsCount(adultsCount + 1)} className="w-7 h-7 flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"><Plus size={14} /></button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="font-bold text-slate-800 text-[14px]">Children</div>
                        <div className="text-[11px] text-slate-500 font-medium">0 - 12 years</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setChildrenAges(prev => prev.slice(0, -1))} className="w-7 h-7 flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50" disabled={childrenAges.length === 0}><Minus size={14} /></button>
                        <span className="font-bold text-slate-800 w-4 text-center">{childrenAges.length}</span>
                        <button type="button" onClick={() => setChildrenAges([...childrenAges, ''])} className="w-7 h-7 flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"><Plus size={14} /></button>
                      </div>
                    </div>

                    {childrenAges.length > 0 && (
                      <div className="border-t border-slate-100 pt-3 mt-1">
                        <div className="text-[12px] font-bold text-slate-700 mb-2">Age of Child(ren)</div>
                        <div className="grid grid-cols-2 gap-2">
                          {childrenAges.map((age, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-500 font-medium">Child {idx + 1} Age</label>
                              <select 
                                value={age}
                                onChange={(e) => {
                                  const newAges = [...childrenAges];
                                  newAges[idx] = e.target.value;
                                  setChildrenAges(newAges);
                                }}
                                className="border border-slate-300 rounded px-2 py-1 text-[13px] bg-white outline-none focus:border-blue-500"
                              >
                                <option value="">Select Age</option>
                                {[...Array(13)].map((_, i) => (
                                  <option key={i} value={i}>{i} yrs</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 font-bold mb-2 tracking-wide">Hotel Preference :</label>
                <div className="flex items-center gap-3">
                  {[1,2,3,4,5].map(num => (
                    <label key={num} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-[14px] font-bold text-slate-800">{num}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-blue-700 font-bold mb-1.5 tracking-wide">Assign To Sales</label>
                <CustomSelect 
                  value={assignSales} 
                  onChange={setAssignSales} 
                  placeholder="Assign To Sales"
                  options={salesOptions}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[13px] text-blue-700 font-bold mb-1.5 tracking-wide">Going To <span className="text-red-500">*</span></label>
                <input type="text" value={goingTo} onChange={(e) => setGoingTo(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
              </div>
              <div>
                <label className="block text-[13px] text-blue-700 font-bold mb-1.5 tracking-wide">Price Range</label>
                <input type="text" value={priceRange} onChange={(e) => setPriceRange(e.target.value)} placeholder="Price Range" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
              </div>
              <div>
                <label className="block text-[13px] text-blue-700 font-bold mb-1.5 tracking-wide">Food Preference</label>
                <CustomSelect 
                  value={foodPref} 
                  onChange={setFoodPref} 
                  placeholder="Food Preference"
                  options={[
                    {label: 'Jain/Satwik', value: 'Jain/Satwik'},
                    {label: 'Non Veg', value: 'Non Veg'},
                    {label: 'Veg', value: 'Veg'}
                  ]} 
                />
              </div>
            </div>

            <div className="space-y-5">
              <CustomDatePicker 
                value={travelDate} 
                onChange={setTravelDate} 
                label="Specific Date" 
                required={true} 
              />
              <div>
                <label className="block text-[13px] text-blue-700 font-bold mb-1.5 tracking-wide">Select Inclusions</label>
                <CustomSelect 
                  value={inclusions} 
                  onChange={setInclusions} 
                  placeholder="Select Inclusions"
                  isMulti={true}
                  options={[
                    {label: 'Flight', value: 'Flight'},
                    {label: 'Hotel', value: 'Hotel'},
                    {label: 'Breakfast', value: 'Breakfast'},
                    {label: 'Breakfast & Lunch', value: 'Breakfast & Lunch'},
                    {label: 'Breakfast & Dinner', value: 'Breakfast & Dinner'},
                    {label: 'All Meals', value: 'All Meals'},
                    {label: 'Gala Dinner', value: 'Gala Dinner'}
                  ]} 
                />
              </div>
              <div>
                <label className="block text-[13px] text-blue-700 font-bold mb-1.5 tracking-wide">Lead Source</label>
                <CustomSelect 
                  value={leadSource} 
                  onChange={setLeadSource} 
                  placeholder="Select Source"
                  options={[
                    {label: 'Website', value: 'WEBSITE'},
                    {label: 'Facebook', value: 'FACEBOOK'},
                    {label: 'Google', value: 'GOOGLE'},
                    {label: 'Instagram', value: 'INSTAGRAM'},
                    {label: 'Referral', value: 'REFERRAL'}
                  ]} 
                />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[13px] text-blue-700 font-bold mb-1.5 tracking-wide">No Of Days</label>
                <input type="text" value={numDays} onChange={(e) => setNumDays(e.target.value)} placeholder="No Of Days" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
              </div>
              <div>
                <label className="block text-[13px] text-blue-700 font-bold mb-1.5 tracking-wide">Select Theme</label>
                <CustomSelect 
                  value={theme} 
                  onChange={setTheme} 
                  placeholder="Select Theme"
                  isMulti={true}
                  options={[
                    {label: 'Honeymoon', value: 'Honeymoon'},
                    {label: 'Adventure', value: 'Adventure'},
                    {label: 'Wildlife', value: 'Wildlife'},
                    {label: 'Beach', value: 'Beach'},
                    {label: 'Family', value: 'Family'},
                    {label: 'Sports', value: 'Sports'},
                    {label: 'Cruise', value: 'Cruise'}
                  ]} 
                />
              </div>
              <div>
                <label className="block text-[13px] text-blue-750 font-bold mb-1.5 tracking-wide">Add Remark</label>
                <input type="text" defaultValue={lead.notes && lead.notes.length > 0 ? lead.notes[lead.notes.length - 1].content : ''} placeholder="Add Remark" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-5 border-t border-slate-200 mt-6">
             <button onClick={handleSaveAndContinue} className="px-6 py-2.5 bg-[#f26522] hover:bg-[#d9551c] text-white text-[14px] font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
               Save & Continue
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadProfileForm;
