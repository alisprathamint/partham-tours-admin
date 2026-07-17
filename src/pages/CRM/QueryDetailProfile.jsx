import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, ChevronDown, Check, User, MessageSquare, Clock } from 'lucide-react';
import api from '../../api/axios';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import SendQuotationModal from './SendQuotationModal';

const QueryDetailProfile = ({ currentLead, fetchLeadDetails, navigate, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newRemark, setNewRemark] = useState('');
  const [isAddingRemark, setIsAddingRemark] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [selectedQuoteContext, setSelectedQuoteContext] = useState(null);

  const [openSteps, setOpenSteps] = useState({
    step1: true,
    step2: false,
    step3: false,
    step4: false
  });

  useEffect(() => {
    const curStatus = currentLead.status || 'NEW';
    setOpenSteps({
      step1: curStatus === 'NEW' || curStatus === 'IN_PROGRESS',
      step2: curStatus === 'PROPOSAL_SENT',
      step3: curStatus === 'NEGOTIATION',
      step4: curStatus === 'BOOKING_CONFIRMED'
    });
  }, [currentLead.status]);

  // Form states (copied from original profile for editing query details)
  const [adultsCount, setAdultsCount] = useState(currentLead.pax ? (parseInt(currentLead.pax) || 2) : 2);
  const [childrenAges, setChildrenAges] = useState([]);
  const [showTravelerPopup, setShowTravelerPopup] = useState(false);
  const travelerRef = useRef(null);

  const [foodPref, setFoodPref] = useState(currentLead.foodPreference || currentLead.foodPref || '');
  const [inclusions, setInclusions] = useState(currentLead.inclusions || []);
  const [theme, setTheme] = useState(currentLead.theme || []);
  const [leadSource, setLeadSource] = useState(currentLead.source ? currentLead.source.toUpperCase().trim() : '');
  const [numDays, setNumDays] = useState(currentLead.numDays || '');
  const [priceRange, setPriceRange] = useState(currentLead.priceRange || '');
  const [assignSales, setAssignSales] = useState('Self');
  const [salesUsers, setSalesUsers] = useState([]);

  let initialGoingTo = currentLead.destination || '';
  let initialGoingFrom = currentLead.origin || '';

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
  const [travelDate, setTravelDate] = useState(currentLead.travelDate ? new Date(currentLead.travelDate).toISOString().split('T')[0] : '');

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

  const handleMarkAsLost = async () => {
    if (!window.confirm("Are you sure you want to mark this query as LOST?")) return;
    try {
      const res = await api.put(`/crm/leads/${currentLead.id}`, { status: 'LOST' });
      if (res.data.success) {
        alert("Query marked as LOST successfully.");
        fetchLeadDetails();
      }
    } catch (err) {
      console.error("Error marking lead as lost:", err);
      alert("Failed to mark query as lost.");
    }
  };

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
        status: currentLead.status || 'IN_PROGRESS'
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

      await api.put(`/crm/leads/${currentLead._id || currentLead.id}`, payload);
      setIsEditing(false);
      fetchLeadDetails();
    } catch (err) {
      console.error('Error saving lead:', err);
    }
  };

  const handleAddRemarkSubmit = async (e) => {
    e.preventDefault();
    if (!newRemark.trim()) return;
    setIsAddingRemark(true);
    try {
      const res = await api.post(`/crm/leads/${currentLead._id || currentLead.id}/notes`, {
        content: newRemark,
        assignedTo: {
          id: user?.id,
          name: user?.name
        }
      });
      if (res.data.success) {
        setNewRemark('');
        fetchLeadDetails();
      }
    } catch (err) {
      console.error(err);
      alert('Error adding remark');
    } finally {
      setIsAddingRemark(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const res = await api.put(`/tasks/${taskId}/complete`);
      if (res.data.success) {
        fetchLeadDetails();
      }
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  const stages = [
    { key: 'NEW', label: 'New Query' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'PROPOSAL_SENT', label: 'Quotation Sent' },
    { key: 'NEGOTIATION', label: 'Negotiation' },
    { key: 'BOOKING_CONFIRMED', label: 'Booking Confirmed' }
  ];

  const getStageIndex = (status) => {
    return stages.findIndex(s => s.key === status);
  };

  const currentStageIdx = getStageIndex(currentLead.status || 'NEW');

  const formatRemarkTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderQuickActionPanel = () => {
    const currentStatus = currentLead.status || 'NEW';
    
    const updateStage = async (newStatus, remarkText) => {
      try {
        const res = await api.put(`/crm/leads/${currentLead.id}`, { status: newStatus });
        if (res.data.success) {
          if (remarkText) {
            await api.post(`/crm/leads/${currentLead.id}/notes`, { content: remarkText });
          }
          alert(`Query successfully moved to stage: ${newStatus.replace('_', ' ')}`);
          fetchLeadDetails();
        }
      } catch (err) {
        console.error("Error updating stage:", err);
        alert("Failed to update stage.");
      }
    };

    const isStep1Active = currentStatus === 'NEW' || currentStatus === 'IN_PROGRESS';
    const isStep2Active = currentStatus === 'PROPOSAL_SENT';
    const isStep3Active = currentStatus === 'NEGOTIATION';
    const isStep4Active = currentStatus === 'BOOKING_CONFIRMED';

    const isStep1Done = !isStep1Active;

    const quoteNotes = currentLead.notes?.filter(n => n.content?.includes('[Quotation Details]')) || [];
    const quotationsList = quoteNotes.map(note => {
      const content = note.content;
      const parts = content.replace('[Quotation Details] ', '').split(' | ');
      const details = {};
      parts.forEach(part => {
        const [key, val] = part.split(': ');
        if (key && val) {
          details[key.trim()] = val.trim();
        }
      });
      return {
        id: note.id || note._id,
        packageName: details['Sent Package'] || 'Standard Package',
        price: details['Price'] || 'N/A',
        duration: details['Duration'] || 'N/A',
        travelDate: details['Travel Date'] || 'N/A',
        noteContent: content
      };
    });

    if (quotationsList.length === 0 && isStep1Done) {
      quotationsList.push({
        id: 'fallback',
        packageName: currentLead.destination ? `Package to ${currentLead.destination}` : 'Standard Package',
        price: currentLead.priceRange ? currentLead.priceRange : 'N/A',
        duration: currentLead.numDays ? `${currentLead.numDays} Days` : 'N/A',
        travelDate: currentLead.travelDate ? new Date(currentLead.travelDate).toLocaleDateString('en-GB') : 'N/A'
      });
    }

    const isStep2Done = currentStatus === 'NEGOTIATION' || currentStatus === 'BOOKING_CONFIRMED';
    const negotiationNotes = currentLead.notes?.filter(n => n.content?.toLowerCase().includes('negotiation') || n.content?.toLowerCase().includes('negotiate')) || [];
    const negotiationHistory = negotiationNotes.map(n => ({
      id: n.id || n._id,
      date: new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      details: n.content,
      agent: n.assignedTo?.name || 'Agent'
    }));

    if (negotiationHistory.length === 0 && isStep2Done) {
      negotiationHistory.push({
        id: 'negotiation-fallback',
        date: new Date(currentLead.updatedAt || currentLead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        details: 'Negotiation stage initiated with client.',
        agent: (currentLead.assignedTo && typeof currentLead.assignedTo === 'object' ? currentLead.assignedTo.name : currentLead.assignedTo) || 'Agent'
      });
    }

    const isStep3Done = currentStatus === 'BOOKING_CONFIRMED';
    const bookingNotes = currentLead.notes?.filter(n => n.content?.toLowerCase().includes('booking') || n.content?.toLowerCase().includes('payment')) || [];
    const bookingHistory = bookingNotes.map(n => ({
      id: n.id || n._id,
      date: new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      details: n.content,
      agent: n.assignedTo?.name || 'Agent'
    }));

    if (bookingHistory.length === 0 && isStep3Done) {
      bookingHistory.push({
        id: 'booking-fallback',
        date: new Date(currentLead.updatedAt || currentLead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        details: 'Booking confirmed. Payments verified.',
        agent: (currentLead.assignedTo && typeof currentLead.assignedTo === 'object' ? currentLead.assignedTo.name : currentLead.assignedTo) || 'Agent'
      });
    }

    const toggleStep = (stepKey) => {
      setOpenSteps(prev => ({
        ...prev,
        [stepKey]: !prev[stepKey]
      }));
    };

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-6">
        <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
          <Check size={18} className="text-blue-600" />
          Query Sales Pipeline (Step-by-Step Actions)
        </h4>
        
        <div className="flex flex-col gap-4">
          {/* Step 1: Send Quotation */}
          <div className={`rounded-xl border overflow-hidden transition-all ${
            isStep1Active 
              ? 'border-blue-500 bg-blue-50/10 ring-1 ring-blue-100' 
              : 'border-slate-200 bg-slate-50/20'
          }`}>
            <div 
              onClick={() => toggleStep('step1')}
              className="px-4 py-3.5 flex justify-between items-center cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                  isStep1Active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  Step 1
                </span>
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  Send Quotation
                  {isStep1Done && (
                    <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 rounded-full p-0.5">
                      <Check size={12} strokeWidth={3} className="text-emerald-600" />
                    </span>
                  )}
                </span>
                {isStep1Active && <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>}
              </div>
              <div className="text-slate-500">
                {openSteps.step1 ? <ChevronDown className="rotate-180 transition-transform" size={16} /> : <ChevronDown className="transition-transform" size={16} />}
              </div>
            </div>
            {openSteps.step1 && (
              <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[11.5px] text-slate-500 font-semibold">Sent Quotations and Packages History</p>
                  <button
                    onClick={() => setIsQuotationModalOpen(true)}
                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
                  >
                    Send New Quotation
                  </button>
                </div>
                
                {quotationsList.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium text-xs">
                    No quotation proposals built yet. Click 'Send New Quotation' to select a package and send.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold text-slate-700">
                      <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-extrabold">Package Name</th>
                          <th className="px-4 py-3 font-extrabold">Duration</th>
                          <th className="px-4 py-3 font-extrabold">Price</th>
                          <th className="px-4 py-3 font-extrabold">Travel Date</th>
                          <th className="px-4 py-3 font-extrabold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {quotationsList.map((q, idx) => (
                          <tr key={q.id === 'fallback' ? `fallback-${idx}` : q.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3.5 text-slate-900 font-bold">{q.packageName}</td>
                            <td className="px-4 py-3.5 text-slate-600">{q.duration}</td>
                            <td className="px-4 py-3.5 text-emerald-600 font-bold">{q.price}</td>
                            <td className="px-4 py-3.5 text-slate-600">{q.travelDate}</td>
                            <td className="px-4 py-3.5 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedQuoteContext(q);
                                  setShowQuoteDetails(true);
                                }}
                                className="px-2.5 py-1 text-[10px] bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-250 rounded transition-colors font-bold"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setIsQuotationModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded transition-colors font-bold"
                              >
                                Resend
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Negotiation */}
          <div className={`rounded-xl border overflow-hidden transition-all ${
            isStep2Active 
              ? 'border-amber-500 bg-amber-50/10 ring-1 ring-amber-100' 
              : 'border-slate-200 bg-slate-50/20'
          }`}>
            <div 
              onClick={() => toggleStep('step2')}
              className="px-4 py-3.5 flex justify-between items-center cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                  isStep2Active ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  Step 2
                </span>
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  Negotiate
                  {isStep2Done && (
                    <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 rounded-full p-0.5">
                      <Check size={12} strokeWidth={3} className="text-emerald-600" />
                    </span>
                  )}
                </span>
                {isStep2Active && <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping"></span>}
              </div>
              <div className="text-slate-500">
                {openSteps.step2 ? <ChevronDown className="rotate-180 transition-transform" size={16} /> : <ChevronDown className="transition-transform" size={16} />}
              </div>
            </div>
            {openSteps.step2 && (
              <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[11.5px] text-slate-500 font-semibold">Negotiation & Discussion Log</p>
                  <button
                    onClick={() => updateStage('NEGOTIATION', '[System] Negotiation started with client.')}
                    className={`py-1.5 px-4 font-bold text-xs rounded-lg transition-all ${
                      isStep2Active
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                    }`}
                  >
                    Start Negotiation
                  </button>
                </div>

                {negotiationHistory.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium text-xs">
                    No negotiation milestones logged. Click 'Start Negotiation' to update stage.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold text-slate-700">
                      <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-extrabold">Date & Time</th>
                          <th className="px-4 py-3 font-extrabold">Milestone Update</th>
                          <th className="px-4 py-3 font-extrabold">Coordinator</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {negotiationHistory.map((h, idx) => (
                          <tr key={h.id === 'negotiation-fallback' ? `negotiation-fallback-${idx}` : h.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3.5 text-slate-900 font-bold w-40">{h.date}</td>
                            <td className="px-4 py-3.5 text-slate-600">{h.details}</td>
                            <td className="px-4 py-3.5 text-slate-600 w-32">{h.agent}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Confirm Booking */}
          <div className={`rounded-xl border overflow-hidden transition-all ${
            isStep3Active 
              ? 'border-emerald-500 bg-emerald-50/10 ring-1 ring-emerald-100' 
              : 'border-slate-200 bg-slate-50/20'
          }`}>
            <div 
              onClick={() => toggleStep('step3')}
              className="px-4 py-3.5 flex justify-between items-center cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                  isStep3Active ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  Step 3
                </span>
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  Confirm Booking
                  {isStep3Done && (
                    <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 rounded-full p-0.5">
                      <Check size={12} strokeWidth={3} className="text-emerald-600" />
                    </span>
                  )}
                </span>
                {isStep3Active && <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>}
              </div>
              <div className="text-slate-500">
                {openSteps.step3 ? <ChevronDown className="rotate-180 transition-transform" size={16} /> : <ChevronDown className="transition-transform" size={16} />}
              </div>
            </div>
            {openSteps.step3 && (
              <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2.5">
                  <p className="text-[11.5px] text-slate-500 font-semibold">Booking confirmation updates & payment status log</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStage('BOOKING_CONFIRMED', '[System] Booking Confirmed & Closed.')}
                      className={`py-1.5 px-4 font-bold text-xs rounded-lg transition-all ${
                        isStep3Active
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                      }`}
                    >
                      Confirm Booking
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm("Confirm Booking & Mark Payment as Received?")) {
                          await updateStage('BOOKING_CONFIRMED', '[System] Booking Confirmed. Payment Received successfully.');
                        }
                      }}
                      className={`py-1.5 px-4 font-bold text-xs rounded-lg transition-all ${
                        isStep3Active
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-755 hover:to-teal-755 text-white shadow-sm'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                      }`}
                    >
                      Payment Received & Confirm Booking
                    </button>
                  </div>
                </div>

                {bookingHistory.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium text-xs">
                    No booking or payment updates logged yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold text-slate-700">
                      <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-extrabold">Date & Time</th>
                          <th className="px-4 py-3 font-extrabold">Confirmation Milestone</th>
                          <th className="px-4 py-3 font-extrabold">Coordinator</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {bookingHistory.map((h, idx) => (
                          <tr key={h.id === 'booking-fallback' ? `booking-fallback-${idx}` : h.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3.5 text-slate-900 font-bold w-40">{h.date}</td>
                            <td className="px-4 py-3.5 text-slate-600">{h.details}</td>
                            <td className="px-4 py-3.5 text-slate-600 w-32">{h.agent}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 4: Finalized */}
          <div className={`rounded-xl border overflow-hidden transition-all ${
            isStep4Active 
              ? 'border-teal-500 bg-teal-50/10 ring-1 ring-teal-100' 
              : 'border-slate-200 bg-slate-50/20'
          }`}>
            <div 
              onClick={() => toggleStep('step4')}
              className="px-4 py-3.5 flex justify-between items-center cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                  isStep4Active ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  Step 4
                </span>
                <span className="font-bold text-xs text-slate-800">Finalized</span>
              </div>
              <div className="text-slate-500">
                {openSteps.step4 ? <ChevronDown className="rotate-180 transition-transform" size={16} /> : <ChevronDown className="transition-transform" size={16} />}
              </div>
            </div>
            {openSteps.step4 && (
              <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                <p className="text-[11.5px] text-slate-500 font-medium">Booking successfully completed, paid, and query successfully resolved.</p>
                
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold text-slate-700">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 font-extrabold">Finalized Date</th>
                        <th className="px-4 py-3 font-extrabold">Lead Status</th>
                        <th className="px-4 py-3 font-extrabold">Target Route</th>
                        <th className="px-4 py-3 font-extrabold">Assigned To</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      <tr className="hover:bg-slate-55/30 transition-colors">
                        <td className="px-4 py-3.5 text-slate-900 font-bold">
                          {new Date(currentLead.updatedAt || currentLead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isStep4Active ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {currentLead.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-semibold">{currentLead.origin || 'N/A'} to {currentLead.destination || 'N/A'}</td>
                        <td className="px-4 py-3.5 text-slate-600 font-bold">
                          {currentLead.assignedTo && typeof currentLead.assignedTo === 'object' ? currentLead.assignedTo.name : currentLead.assignedTo || 'Unassigned'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-6 space-y-6 font-sans text-slate-800">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-800 text-white font-bold text-base px-5 py-4 flex items-center justify-between shadow-inner rounded-t-xl">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 px-3 py-1.5 mr-4 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 shadow-sm"
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              <span className="text-[12px] font-bold tracking-wide">BACK</span>
            </button>
            <div className="text-[15px] tracking-wide">
              Query Details - <span className="text-blue-300 font-bold">{currentLead.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs bg-blue-600/30 text-blue-200 border border-blue-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              {currentLead.leadCategory || 'B2C'}
            </span>
            <span className="text-xs bg-slate-700/60 text-slate-200 border border-slate-600/40 px-3 py-1 rounded-full font-bold">
              ID: #{currentLead.id}
            </span>
          </div>
        </div>

        <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-2 relative">
            <div className="hidden md:block absolute left-[10%] right-[10%] top-[25px] h-[3px] bg-slate-200 z-0">
              <div 
                className="h-full bg-blue-600 transition-all duration-500" 
                style={{ width: `${(Math.max(0, currentStageIdx) / (stages.length - 1)) * 100}%` }}
              />
            </div>

            {stages.map((stage, idx) => {
              const isActive = idx <= currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              return (
                <div key={stage.key} className="flex flex-col items-center text-center z-10 w-full md:w-auto relative">
                  <div 
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110' 
                        : isActive 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white text-slate-400 border-2 border-slate-200'
                    }`}
                  >
                    {isActive && !isCurrent ? <Check size={18} strokeWidth={3} /> : idx + 1}
                  </div>
                  <div className="mt-2">
                    <p className={`text-[12px] font-bold tracking-wide uppercase ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                      {stage.label}
                    </p>
                    {isCurrent && (
                      <span className="inline-block text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full mt-0.5 animate-pulse">
                        Active Stage
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                Query Information
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleMarkAsLost}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-200 bg-red-50 text-red-650 hover:bg-red-100 transition-all"
                >
                  Mark Lost
                </button>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    isEditing 
                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                      : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Details'}
                </button>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveAndContinue(); }} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Going From</label>
                  <input type="text" value={goingFrom} onChange={(e) => setGoingFrom(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Going To <span className="text-red-500">*</span></label>
                  <input type="text" value={goingTo} onChange={(e) => setGoingTo(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
                </div>

                <div className="relative" ref={travelerRef}>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Travelers <span className="text-red-500">*</span></label>
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
                          <button type="button" onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))} className="w-7 h-7 flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100" disabled={adultsCount <= 1}><Minus size={14} /></button>
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
                          <button type="button" onClick={() => setChildrenAges(prev => prev.slice(0, -1))} className="w-7 h-7 flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100" disabled={childrenAges.length === 0}><Minus size={14} /></button>
                          <span className="font-bold text-slate-800 w-4 text-center">{childrenAges.length}</span>
                          <button type="button" onClick={() => setChildrenAges([...childrenAges, ''])} className="w-7 h-7 flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"><Plus size={14} /></button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <CustomDatePicker 
                  value={travelDate} 
                  onChange={setTravelDate} 
                  label="Specific Date" 
                  required={true} 
                />

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Price Range</label>
                  <input type="text" value={priceRange} onChange={(e) => setPriceRange(e.target.value)} placeholder="Price Range" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Food Preference</label>
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Select Inclusions</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Lead Source</label>
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">No Of Days</label>
                  <input type="text" value={numDays} onChange={(e) => setNumDays(e.target.value)} placeholder="No Of Days" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Select Theme</label>
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

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 shadow-sm transition-all"
                  >
                    Save Details
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-5 space-y-6 text-[13px]">
                <div className="space-y-3.5">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded w-fit">
                    📞 Contact Info
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 font-semibold">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Name</span>
                      <span className="text-slate-900 font-bold text-[14px]">{currentLead.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Phone</span>
                      <span className="text-slate-900 font-bold">{currentLead.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Email</span>
                      <span className="text-slate-900 font-bold truncate max-w-[210px]">{currentLead.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded w-fit">
                    ✈️ Travel Requirements
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 font-semibold">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Destination Route</span>
                      <span className="text-slate-900 font-bold">
                        {currentLead.origin || 'N/A'} ➡️ {currentLead.destination || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Total Travelers</span>
                      <span className="text-slate-900 font-bold">{currentLead.pax || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Travel Date</span>
                      <span className="text-slate-900 font-bold">
                        {currentLead.travelDate ? new Date(currentLead.travelDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Duration</span>
                      <span className="text-slate-900 font-bold">{currentLead.numDays ? `${currentLead.numDays} Days` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded w-fit">
                    ⭐ Preferences & Budget
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 font-semibold">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Price Range</span>
                      <span className="text-slate-900 font-bold">{currentLead.priceRange || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Food Preference</span>
                      <span className="text-slate-900 font-bold">{currentLead.foodPreference || currentLead.foodPref || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-start py-1">
                      <span className="text-slate-500 font-bold">Inclusions</span>
                      <span className="text-slate-900 font-bold text-right max-w-[200px]">
                        {Array.isArray(currentLead.inclusions) ? currentLead.inclusions.join(', ') : currentLead.inclusions || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start py-1">
                      <span className="text-slate-500 font-bold">Theme</span>
                      <span className="text-slate-900 font-bold text-right max-w-[200px]">
                        {Array.isArray(currentLead.theme) ? currentLead.theme.join(', ') : currentLead.theme || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-bold">Lead Source</span>
                      <span className="text-slate-900 font-bold uppercase">{currentLead.source || 'Website'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-600" />
                Internal Remarks & Timeline ({currentLead.notes?.length || 0})
              </h3>
            </div>

            <div className="p-5 flex flex-col space-y-4">
              <div className="max-h-[350px] overflow-y-auto space-y-0 pr-1 relative">
                {!currentLead.notes || currentLead.notes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">
                    No remarks posted yet. Add a remark below to update the timeline.
                  </div>
                ) : (
                  <>
                    <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-slate-200 z-0"></div>
                    
                    {currentLead.notes
                      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                      .map((note) => (
                        <div key={note.id} className="relative pl-10 pb-5 last:pb-1 z-10">
                          <div className="absolute left-3.5 top-2.5 w-3 h-3 rounded-full border-2 border-white bg-blue-600 ring-4 ring-blue-100 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-white"></div>
                          </div>
                          
                          <div className="bg-slate-50 hover:bg-slate-100/70 p-3.5 rounded-xl border border-slate-200/50 shadow-sm hover:shadow transition-all duration-205">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                                  {(note.assignedTo?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-[12px] text-slate-800">
                                  {note.assignedTo?.name || 'User'}
                                </span>
                                <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  Agent
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {formatRemarkTime(note.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap pl-8">
                              {note.content}
                            </p>
                          </div>
                        </div>
                      ))
                    }
                  </>
                )}
              </div>

              <form onSubmit={handleAddRemarkSubmit} className="border-t border-slate-100 pt-4 flex gap-3">
                <textarea
                  rows="2"
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  placeholder="Type an internal note or update remark here..."
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-450 bg-slate-50 focus:bg-white transition-all resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={isAddingRemark || !newRemark.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg disabled:opacity-50 shadow-md hover:shadow-lg transition-all h-fit self-end"
                >
                  {isAddingRemark ? 'Posting...' : 'Post Note'}
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                Follow-ups & Tasks ({currentLead.tasks?.length || 0})
              </h3>
            </div>

            <div className="p-5">
              {!currentLead.tasks || currentLead.tasks.length === 0 ? (
                <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">
                  No follow-up tasks scheduled.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentLead.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between bg-white border border-slate-250 p-3 rounded-lg hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={task.isCompleted}
                          onChange={() => handleCompleteTask(task.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <p className={`text-xs font-bold ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {task.title}
                          </p>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Due: {new Date(task.dueDate).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      </div>
                      {task.isCompleted ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsQuotationModalOpen(true)}
                            className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-bold uppercase tracking-wider transition-all"
                          >
                            Send Quotation
                          </button>
                          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold uppercase">
                            Done
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1.5 rounded font-bold uppercase">
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {renderQuickActionPanel()}

      <SendQuotationModal 
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        query={currentLead}
        onStatusUpdate={fetchLeadDetails}
      />

      {showQuoteDetails && (() => {
        const details = selectedQuoteContext || {
          packageName: currentLead.destination ? `Package to ${currentLead.destination}` : 'Standard Package',
          price: currentLead.priceRange ? currentLead.priceRange : 'N/A',
          duration: currentLead.numDays ? `${currentLead.numDays} Days` : 'N/A',
          travelDate: currentLead.travelDate ? new Date(currentLead.travelDate).toLocaleDateString('en-GB') : 'N/A'
        };
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl border border-slate-200 mx-4 relative animate-in fade-in zoom-in-95 duration-150">
              <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2 border-b pb-3">
                <span className="p-1.5 bg-blue-50 text-blue-650 rounded-lg">
                  <Check size={18} strokeWidth={2.5} />
                </span>
                Sent Proposal Details
              </h3>
              
              <div className="space-y-3.5 text-slate-700">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Package Name</span>
                  <span className="text-sm font-extrabold text-slate-900">{details.packageName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Price</span>
                  <span className="text-sm font-black text-emerald-600">{details.price || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Duration</span>
                  <span className="text-sm font-extrabold text-slate-900">{details.duration || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Travel Date</span>
                  <span className="text-sm font-bold text-slate-800">{details.travelDate || 'N/A'}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowQuoteDetails(false);
                  setSelectedQuoteContext(null);
                }}
                className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default QueryDetailProfile;
