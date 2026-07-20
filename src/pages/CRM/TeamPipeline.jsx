import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { MoreVertical, Calendar, Phone, MapPin, MessageCircle, FileText, Clock, IndianRupee, GripVertical, Search, LayoutGrid, List, ChevronDown } from 'lucide-react';
import SendQuotationModal from './SendQuotationModal';
import api from '../../api/axios';


const CustomSelect = ({ label, options, value, onChange, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 bg-white border ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-300'} rounded-md text-sm text-slate-900 font-medium cursor-pointer flex justify-between items-center shadow-sm transition-shadow`}
        >
          <span className={value ? 'text-slate-900' : 'text-slate-800'}>{selectedOption ? selectedOption.label : placeholder}</span>
          <div className={`text-slate-700 transition-transform duration-300 ${isOpen ? '-rotate-180' : ''}`}>
            <ChevronDown size={16} />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
            <div
              className="px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
              onClick={() => { onChange(""); setIsOpen(false); }}
            >
              {placeholder}
            </div>
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${String(value) === String(opt.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'}`}
                onClick={() => { onChange(String(opt.value)); setIsOpen(false); }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const STAGES = [
  { id: 'ASSIGNED', label: 'Assigned', color: 'bg-indigo-500', headerBg: 'bg-indigo-50', textColor: 'text-indigo-700', border: 'border-indigo-200' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-500', headerBg: 'bg-amber-50', textColor: 'text-amber-700', border: 'border-amber-200' },
  { id: 'PROPOSAL_SENT', label: 'Quotation Sent', color: 'bg-purple-500', headerBg: 'bg-purple-50', textColor: 'text-purple-700', border: 'border-purple-200' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-pink-500', headerBg: 'bg-pink-50', textColor: 'text-pink-700', border: 'border-pink-200' },
  { id: 'BOOKING_CONFIRMED', label: 'Booking Confirmed', color: 'bg-blue-500', headerBg: 'bg-blue-50', textColor: 'text-blue-700', border: 'border-blue-200' },
  { id: 'PAYMENT_RECEIVED', label: 'Payment Received', color: 'bg-emerald-500', headerBg: 'bg-emerald-50', textColor: 'text-emerald-700', border: 'border-emerald-200' },
  { id: 'LOST', label: 'Lost Leads', color: 'bg-rose-500', headerBg: 'bg-rose-50', textColor: 'text-rose-700', border: 'border-rose-200' }
];

const TeamPipeline = () => {
  const { token, user } = useAuth();
  const { subscribe } = useWebSocket();
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [selectedQuotationQuery, setSelectedQuotationQuery] = useState(null);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [draggableCardId, setDraggableCardId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [statusDropdownId, setStatusDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [viewMode, setViewMode] = useState('table');
  const [destinations, setDestinations] = useState([]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isClosingEdit, setIsClosingEdit] = useState(false);
  const [editingQuery, setEditingQuery] = useState(null);

  const handleCloseEditModal = () => {
    setIsClosingEdit(true);
    setTimeout(() => {
      setIsClosingEdit(false);
      setIsEditModalOpen(false);
    }, 280);
  };


  // Filter States
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    customerName: '',
    customerMobile: '',
    destination: '',
    branch: '',
    assignedTo: '',
    fromDate: '',
    toDate: '',
    unAssigned: false
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      const data = response.data;
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      const data = response.data;
      if (data.success) {
        setBranches(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      customerName: '', customerMobile: '', destination: '', branch: '', assignedTo: '', fromDate: '', toDate: '', unAssigned: false
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const fetchQueries = async () => {
    try {
      const response = await api.get('/crm/leads');
      const data = response.data;
      if (data.success) {
        setQueries(data.data);
      }
    } catch (err) {
      console.error('Error fetching queries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDestinations = async () => {
    try {
      const response = await api.get('/destinations');
      const data = response.data;
      if (data.success) {
        setDestinations(data.data?.destinations || []);
      }
    } catch (err) {
      console.error('Error fetching destinations:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQueries();
      fetchBranches();
      if (user?.role !== 'SALES_EXECUTIVE') {
        fetchUsers();
      }
    }
  }, [token, user]);

  // Real-time: refetch queries when lead is updated or assigned
  useEffect(() => {
    if (!subscribe) return;
    const unsubUpdate = subscribe('lead_updated', () => {
      fetchQueries();
    });
    const unsubAssign = subscribe('lead_assigned', () => {
      fetchQueries();
    });
    return () => {
      unsubUpdate();
      unsubAssign();
    };
  }, [subscribe]);

  useEffect(() => {
    if (token && isEditModalOpen && destinations.length === 0) {
      fetchDestinations();
    }
  }, [token, isEditModalOpen, destinations.length]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
      setStatusDropdownId(null);
    };
    if (openDropdownId !== null || statusDropdownId !== null) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdownId, statusDropdownId]);

  const handleDragStart = (e, queryId) => {
    setDraggingId(queryId);
    e.dataTransfer.setData('queryId', queryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e) => {
    setDraggingId(null);
    setDragOverStage(null);
    setDraggableCardId(null);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverStage(null);
  };

  const updateQueryStatus = async (queryId, newStatus) => {
    setQueries(prev => prev.map(q => q.id === queryId ? { ...q, status: newStatus } : q));
    try {
      const res = await api.put(`/crm/leads/${queryId}`, { status: newStatus });
      const data = res.data;
      if (!data.success) {
        fetchQueries();
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      fetchQueries();
    }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverStage(null);
    const queryId = e.dataTransfer.getData('queryId');
    if (!queryId) return;
    updateQueryStatus(queryId, newStatus);
  };

  const handleDeleteQuery = async (queryId) => {
    if (!window.confirm('Are you sure you want to delete this query? This action cannot be undone.')) return;
    try {
      const res = await api.delete(`/crm/leads/${queryId}`);
      const data = res.data;
      if (data.success) {
        setQueries(prev => prev.filter(q => q.id !== queryId));
      } else {
        alert('Failed to delete query');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting query');
    }
  };

  const handleAddNote = async (queryId, content) => {
    try {
      const res = await api.post(`/crm/leads/${queryId}/notes`, { content });
      const data = res.data;
      if (data.success) {
        alert('Note added successfully!');
        fetchQueries();
      } else {
        alert('Failed to add note');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding note');
    }
  };

  const handleEditClick = (query) => {
    let formattedDate = '';
    if (query.travelDate) {
      formattedDate = new Date(query.travelDate).toISOString().split('T')[0];
    }
    setEditingQuery({ ...query, travelDate: formattedDate });
    setIsEditModalOpen(true);
  };

  const handleUpdateQuery = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/crm/leads/${editingQuery.id}`, {
        name: editingQuery.name,
        phone: editingQuery.phone,
        email: editingQuery.email,
        travelDate: editingQuery.travelDate || null,
        pax: editingQuery.pax || null,
        numDays: editingQuery.numDays || null,
        destination: editingQuery.destination
      });
      const data = res.data;
      if (data.success) {
        handleCloseEditModal();
        fetchQueries();
      } else {
        alert('Failed to update query');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating query');
    }
  };

  const handleOpenQuotation = (query) => {
    setSelectedQuotationQuery(query);
    setIsQuotationModalOpen(true);
  };

  const handleCloseQuotation = () => {
    setIsQuotationModalOpen(false);
    setTimeout(() => setSelectedQuotationQuery(null), 300); // allow animation
  };

  // Helper for generating initials
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderKanbanCard = (query) => {
    const isDragging = draggingId === query.id;
    return (
      <div
        key={query.id}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, query.id)}
        onDragEnd={handleDragEnd}
        className={`bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 flex flex-col gap-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex gap-2.5 items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
              {getInitials(query.name)}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs leading-tight truncate max-w-[140px]">{query.name}</h4>
              <div className="text-[9px] font-medium text-slate-500 mt-0.5">#{query.id + 2500000}</div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (openDropdownId === query.id) {
                  setOpenDropdownId(null);
                } else {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const menuHeight = 160;
                  const spaceBelow = window.innerHeight - rect.bottom;
                  
                  if (spaceBelow < menuHeight) {
                    setDropdownPos({ bottom: Math.round(window.innerHeight - rect.top + 4), right: Math.round(window.innerWidth - rect.right) });
                  } else {
                    setDropdownPos({ top: Math.round(rect.bottom + 4), right: Math.round(window.innerWidth - rect.right) });
                  }
                  setOpenDropdownId(query.id);
                }
              }}
              className="text-slate-400 hover:text-slate-800 p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <MoreVertical size={14} />
            </button>
            {openDropdownId === query.id && createPortal(
              <div
                className="fixed w-36 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-200 text-left"
                style={{ 
                  ...(dropdownPos.bottom ? { bottom: `${dropdownPos.bottom}px` } : { top: `${dropdownPos.top}px` }),
                  right: `${dropdownPos.right}px` 
                }}
              >
                <div className="py-1">
                  <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleEditClick(query); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">Edit Details</button>
                  <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); const note = window.prompt('Enter your note:'); if (note) handleAddNote(query.id, note); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">Add Note</button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleDeleteQuery(query.id); }} className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">Delete Query</button>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-700 font-medium">
            <Phone size={11} className="text-slate-400" /> {query.phone}
          </div>
          {query.destination && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-700 font-medium">
              <MapPin size={11} className="text-blue-400" />
              <span className="truncate max-w-[180px]">{query.destination} {query.numDays && `(${query.numDays}D)`}</span>
            </div>
          )}
        </div>

        <div className="flex gap-1.5 pt-1">
            <button className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-emerald-100" title="WhatsApp" onClick={() => { if (query.phone) window.open(`https://wa.me/${query.phone.replace(/\D/g, '')}`, '_blank'); }}>
              <MessageCircle size={10} />
            </button>
            <button className="w-6 h-6 rounded bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-blue-100" title="Call" onClick={() => { if (query.phone) window.open(`tel:${query.phone}`, '_self'); }}>
              <Phone size={10} />
            </button>
            <button
              onClick={() => handleOpenQuotation(query)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 text-white hover:bg-slate-700 transition-colors text-[9px] font-medium shadow-sm flex-1 justify-center"
            >
              <FileText size={10} /> Quote
            </button>
        </div>

        <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <Clock size={10} className="text-amber-500" />
            <span className="text-[9px] font-bold text-amber-700">{new Date(query.updatedAt).toLocaleDateString('en-GB')}</span>
          </div>
          {query.assignedTo ? (
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100">
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white flex justify-center items-center text-[7px]">{getInitials(query.assignedTo.name)}</div>
              {query.assignedTo.name.split(' ')[0]}
            </div>
          ) : (
             <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">Unassigned</span>
          )}
        </div>
      </div>
    );
  };

  const renderTableRow = (query) => {
    const dateObj = new Date(query.createdAt);
    const fullDayStr = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
    const dateMonthStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const yearStr = dateObj.toLocaleDateString('en-GB', { year: 'numeric' });
    const currentStage = STAGES.find(s => s.id === query.status) || STAGES[0];

    return (
      <tr key={query.id} className="align-middle border-b border-slate-100 transition-colors hover:bg-slate-50/80">
        <td className="px-3.5 py-3 text-[12px] text-slate-800 font-medium whitespace-nowrap align-middle border-r border-slate-100">
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-slate-800 capitalize">{fullDayStr}</span>
            <span className="text-[11px] text-slate-700 font-medium">{dateMonthStr}</span>
            <span className="text-[10px] text-slate-500">{yearStr}</span>
          </div>
        </td>
        <td className="px-3.5 py-3 align-middle border-r border-slate-100">
          <div className="flex flex-col justify-center h-full">
            <div className="font-bold text-slate-800 text-xs flex items-center gap-2 mb-0.5">
              {query.name}
            </div>
            <div className="flex flex-col">
              {query.phone && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="text-slate-700 text-[10.5px] font-medium">{query.phone}</div>
                </div>
              )}
              {query.email && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="text-slate-800 text-[10px] truncate max-w-[200px]">{query.email}</div>
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-3.5 py-3 text-xs text-slate-700 align-middle border-r border-slate-100">
          <div className="font-bold text-slate-800 text-xs">{query.destination || 'Not Specified'}</div>
          {query.numDays && <div className="text-slate-500 text-[10px] mt-0.5 font-medium">{query.numDays} Days</div>}
        </td>
        <td className="px-3.5 py-3 align-middle text-center border-r border-slate-100">
            <div className="relative mx-auto w-32">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusDropdownId(statusDropdownId === query.id ? null : query.id);
                }}
                className={`flex items-center justify-between gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold border ${currentStage.headerBg} ${currentStage.textColor} ${currentStage.border} hover:opacity-80 transition-opacity w-full uppercase tracking-wide shadow-sm`}
              >
                <span className="truncate">{currentStage.label}</span>
                <ChevronDown size={12} className="flex-shrink-0" />
              </button>
              {statusDropdownId === query.id && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
                  <div className="py-1">
                    {STAGES.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setStatusDropdownId(null);
                          if (s.id !== query.status) updateQueryStatus(query.id, s.id);
                        }}
                        className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors flex items-center gap-2 ${s.id === query.status ? 'bg-slate-50 text-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${s.color}`}></div>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </td>
        <td className="px-3.5 py-3 align-middle border-r border-slate-100">
          <div className="text-slate-700 text-[11px] truncate max-w-[150px]" title={query.notes && query.notes.length > 0 ? query.notes[query.notes.length - 1].content : ''}>
            {query.notes && query.notes.length > 0 
              ? query.notes[query.notes.length - 1].content 
              : <span className="italic text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">No remarks</span>
            }
          </div>
        </td>
        <td className="px-3.5 py-3 align-middle border-r border-slate-100">
          <div className="flex items-center justify-start gap-2">
             <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-[10px] shadow-sm flex-shrink-0">
               {query.assignedTo ? query.assignedTo.name.charAt(0).toUpperCase() : 'U'}
             </div>
             <div className="text-slate-800 font-bold text-[11px] truncate max-w-[100px]">
               {query.assignedTo ? query.assignedTo.name : 'Unassigned'}
             </div>
          </div>
        </td>
        <td className="px-3.5 py-3 text-center align-middle sticky right-0 bg-white z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-center gap-1.5">
            <button className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-emerald-100" title="WhatsApp" onClick={() => { if (query.phone) window.open(`https://wa.me/${query.phone.replace(/\D/g, '')}`, '_blank'); }}>
              <MessageCircle size={13} />
            </button>
            <button className="w-7 h-7 rounded bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-blue-100" title="Call" onClick={() => { if (query.phone) window.open(`tel:${query.phone}`, '_self'); }}>
              <Phone size={13} />
            </button>
            <div className="relative">
              <button
                className={`flex items-center justify-center w-7 h-7 rounded transition-all shadow-sm border ${openDropdownId === query.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (openDropdownId === query.id) {
                    setOpenDropdownId(null);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const menuHeight = 160;
                    const spaceBelow = window.innerHeight - rect.bottom;
                    
                    if (spaceBelow < menuHeight) {
                      setDropdownPos({ bottom: Math.round(window.innerHeight - rect.top + 4), right: Math.round(window.innerWidth - rect.right) });
                    } else {
                      setDropdownPos({ top: Math.round(rect.bottom + 4), right: Math.round(window.innerWidth - rect.right) });
                    }
                    setOpenDropdownId(query.id);
                  }
                }}
              >
                <MoreVertical size={14} />
              </button>
              {openDropdownId === query.id && createPortal(
                <div
                  className="fixed w-36 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-200 text-left"
                  style={{ 
                    ...(dropdownPos.bottom ? { bottom: `${dropdownPos.bottom}px` } : { top: `${dropdownPos.top}px` }),
                    right: `${dropdownPos.right}px` 
                  }}
                >
                  <div className="py-1">
                    <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleEditClick(query); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">Edit Details</button>
                    <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleOpenQuotation(query); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">Send Quote</button>
                    <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); const note = window.prompt('Enter your note:'); if (note) handleAddNote(query.id, note); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">Add Note</button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleDeleteQuery(query.id); }} className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">Delete Query</button>
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const filteredQueries = queries.filter(q => {
    let match = true;
    if (appliedFilters.customerName && !q.name?.toLowerCase().includes(appliedFilters.customerName.toLowerCase())) match = false;
    if (appliedFilters.customerMobile && !q.phone?.includes(appliedFilters.customerMobile)) match = false;
    if (appliedFilters.destination && !q.destination?.toLowerCase().includes(appliedFilters.destination.toLowerCase())) match = false;
    if (appliedFilters.branch && q.branchId !== parseInt(appliedFilters.branch)) match = false;
    if (appliedFilters.assignedTo && q.assignedTo?.id !== parseInt(appliedFilters.assignedTo)) match = false;
    if (appliedFilters.unAssigned && q.assignedTo) match = false;
    if (appliedFilters.fromDate && new Date(q.createdAt) < new Date(appliedFilters.fromDate)) match = false;
    if (appliedFilters.toDate && new Date(q.createdAt) > new Date(appliedFilters.toDate + 'T23:59:59')) match = false;
    return match;
  });

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex justify-between items-end flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Team Pipeline</h2>
          <p className="text-sm text-slate-700 mt-1">
            Drag and drop cards across stages to move them through your sales pipeline.
          </p>
        </div>
        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center shadow-inner border border-slate-200/60">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-md flex items-center justify-center transition-all ${viewMode === 'board' ? 'bg-white shadow text-blue-600' : 'text-slate-700 hover:text-slate-700'}`}
              title="Board View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md flex items-center justify-center transition-all ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-slate-700 hover:text-slate-700'}`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
          <div className="bg-white px-4 py-2 border border-slate-200 rounded-lg shadow-sm flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-800">Total Assigned Leads</span>
            <span className="text-sm font-bold text-slate-700">{filteredQueries.length} Leads</span>
          </div>
        </div>
      </div>


      {/* Filter Section */}
      <div className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-300 flex-shrink-0 ${isFilterExpanded ? '' : 'overflow-hidden'}`}>
        <div
          className={`px-5 py-3.5 cursor-pointer flex justify-between items-center transition-colors ${isFilterExpanded ? 'bg-blue-50/50 border-b border-slate-100' : 'hover:bg-slate-50'}`}
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div className="flex items-center gap-2.5 text-blue-800 font-bold text-sm tracking-wide">
            <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
              <Search size={14} strokeWidth={2.5} />
            </div>
            FILTER RESULTS
          </div>
          <button className="text-slate-800 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded-full">
            <ChevronDown size={18} className={`transform transition-transform duration-300 ${!isFilterExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isFilterExpanded && (
          <div className="p-5 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Name</label>
                <input
                  type="text" placeholder="Search by name..." value={filters.customerName} onChange={e => setFilters({ ...filters, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Mobile</label>
                <input
                  type="text" placeholder="Search by mobile..." value={filters.customerMobile} onChange={e => setFilters({ ...filters, customerMobile: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Destination</label>
                <input
                  type="text" placeholder="E.g. Sikkim, Dubai" value={filters.destination} onChange={e => setFilters({ ...filters, destination: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <CustomSelect
                label="Branch"
                placeholder="All Branches"
                value={filters.branch}
                onChange={(val) => setFilters({ ...filters, branch: val, assignedTo: '' })}
                options={branches.map(b => ({ value: b.id, label: b.name }))}
              />
              <CustomSelect
                label="Assigned To"
                placeholder="Any Owner"
                value={filters.assignedTo}
                onChange={(val) => setFilters({ ...filters, assignedTo: val })}
                options={(filters.branch ? users.filter(u => String(u.branchId) === String(filters.branch)) : users).map(u => ({ value: u.id, label: u.name }))}
              />
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">From Date</label>
                <input
                  type="date" value={filters.fromDate} onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">To Date</label>
                <input
                  type="date" value={filters.toDate} onChange={e => setFilters({ ...filters, toDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.unAssigned}
                    onChange={e => setFilters({ ...filters, unAssigned: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 focus:ring-2 transition-colors"
                  />
                  Show Un-Assigned Only
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-slate-200">
              <button
                onClick={handleResetFilters}
                className="px-5 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold rounded-md text-sm transition-all shadow-sm"
              >
                Reset Filters
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm flex items-center gap-2 shadow-sm transition-all"
              >
                <Search size={14} strokeWidth={2.5} /> Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-4 pr-2 custom-scrollbar">
          {viewMode === 'board' ? (
            <div className="flex gap-5 w-full h-full pb-2 overflow-x-auto custom-scrollbar">
              {STAGES.map(stage => {
                const stageQueries = filteredQueries.filter(q => q.status === stage.id);
                const isDragOver = dragOverStage === stage.id;

                return (
                  <div
                    key={stage.id}
                    className={`flex-shrink-0 w-[300px] flex flex-col rounded-xl transition-colors duration-200 ${isDragOver ? 'bg-slate-100/80 ring-2 ring-blue-400 ring-inset' : 'bg-slate-50/60 border border-slate-200'}`}
                    onDragOver={(e) => handleDragOver(e, stage.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
                    <div className={`px-4 py-3 border-b ${stage.border} ${stage.headerBg} rounded-t-xl flex justify-between items-center shadow-sm`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                        <span className={`font-bold text-[13px] ${stage.textColor}`}>{stage.label}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white shadow-sm ${stage.textColor}`}>
                        {stageQueries.length}
                      </span>
                    </div>

                    <div className="p-3 flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar min-h-[150px] max-h-[calc(100vh-250px)]">
                      {stageQueries.length > 0 ? (
                         stageQueries.map(query => renderKanbanCard(query))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-24 text-slate-800 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/50 m-1 hover:bg-slate-100 transition-colors">
                          <span className="text-xs font-medium">Drop queries here</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
              <div className="overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
                    <tr>
                      <th className="px-3.5 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider w-[12%]">Created Date</th>
                      <th className="px-3.5 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider w-[22%]">Customer Details</th>
                      <th className="px-3.5 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider w-[16%]">Requirement</th>
                      <th className="px-3.5 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center w-[12%]">Status</th>
                      <th className="px-3.5 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider w-[18%]">Remarks</th>
                      <th className="px-3.5 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider w-[12%]">Assigned To</th>
                      <th className="px-3.5 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center sticky right-0 bg-slate-50 z-20 w-[8%]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQueries.length > 0 ? (
                      filteredQueries.map(query => renderTableRow(query))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-700">No leads found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Scrollbar style just for this component to keep it sleek */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <SendQuotationModal
        isOpen={isQuotationModalOpen}
        onClose={handleCloseQuotation}
        query={selectedQuotationQuery}
        onStatusUpdate={updateQueryStatus}
      />

      {/* Edit Query Modal */}
      {isEditModalOpen && createPortal(
        <div className={`fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm ${isClosingEdit ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto ${isClosingEdit ? 'animate-slide-out-left' : 'animate-slide-in-left'}`}>
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800">Edit Query Details</h3>
              <button onClick={handleCloseEditModal} className="text-slate-800 hover:text-red-500 hover:bg-red-50 rounded-md p-1 transition-colors">&times;</button>
            </div>

            <form onSubmit={handleUpdateQuery} className="p-5 space-y-3.5">

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Customer Name</label>
                <input
                  type="text"
                  value={editingQuery?.name || ''}
                  onChange={(e) => setEditingQuery({ ...editingQuery, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    value={editingQuery?.phone || ''}
                    onChange={(e) => setEditingQuery({ ...editingQuery, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={editingQuery?.email || ''}
                    onChange={(e) => setEditingQuery({ ...editingQuery, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2"></div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Destination</label>
                <select
                  value={editingQuery?.destination || ''}
                  onChange={(e) => setEditingQuery({ ...editingQuery, destination: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                >
                  <option value="">Select a Destination</option>
                  {destinations.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                  {/* Fallback if the current destination is not in the list */}
                  {editingQuery?.destination && !destinations.some(d => d.name === editingQuery.destination) && (
                    <option value={editingQuery.destination}>{editingQuery.destination}</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Travel Date</label>
                  <input
                    type="date"
                    value={editingQuery?.travelDate || ''}
                    onChange={(e) => setEditingQuery({ ...editingQuery, travelDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Pax</label>
                    <input
                      type="number"
                      min="1"
                      value={editingQuery?.pax || ''}
                      onChange={(e) => setEditingQuery({ ...editingQuery, pax: e.target.value })}
                      placeholder="e.g. 2"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Days</label>
                    <input
                      type="number"
                      min="1"
                      value={editingQuery?.numDays || ''}
                      onChange={(e) => setEditingQuery({ ...editingQuery, numDays: e.target.value })}
                      placeholder="e.g. 5"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-2.5">
                <button type="button" onClick={handleCloseEditModal} className="px-4 py-1.5 text-xs text-slate-800 font-bold hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TeamPipeline;
