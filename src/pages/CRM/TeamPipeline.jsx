import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
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
  { id: 'BOOKING_CONFIRMED', label: 'Booking Confirmed', color: 'bg-indigo-500', headerBg: 'bg-indigo-50', textColor: 'text-indigo-700', border: 'border-indigo-200' },
  { id: 'PAYMENT_RECEIVED', label: 'Payment Received', color: 'bg-teal-500', headerBg: 'bg-teal-50', textColor: 'text-teal-700', border: 'border-teal-200' },
  { id: 'WON', label: 'Closed Won', color: 'bg-emerald-500', headerBg: 'bg-emerald-50', textColor: 'text-emerald-700', border: 'border-emerald-200' },
  { id: 'LOST', label: 'Closed Lost', color: 'bg-rose-500', headerBg: 'bg-rose-50', textColor: 'text-rose-700', border: 'border-rose-200' }
];

const TeamPipeline = () => {
  const { token, user } = useAuth();
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
  const [filters, setFilters] = useState({
    customerName: '',
    customerMobile: '',
    destination: '',
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

  const handleResetFilters = () => {
    const defaultFilters = {
      customerName: '', customerMobile: '', destination: '', assignedTo: '', fromDate: '', toDate: '', unAssigned: false
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
      if (user?.role !== 'SALES_EXECUTIVE') {
        fetchUsers();
      }
    }
  }, [token, user]);

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

  const renderQueryRow = (query, isBoard = true) => {
    const isDragging = draggingId === query.id;
    const currentStage = STAGES.find(s => s.id === query.status) || STAGES[0];

    return (
      <tr
        key={query.id}
        draggable={isBoard && draggableCardId === query.id}
        onDragStart={(e) => isBoard ? handleDragStart(e, query.id) : undefined}
        onDragEnd={isBoard ? handleDragEnd : undefined}
        className={`bg-white hover:bg-blue-50 transition-colors group ${isDragging ? 'opacity-50' : ''
          } ${isBoard && draggableCardId === query.id ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        {/* Client Info */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            {isBoard && (
              <button
                className="text-slate-300 hover:text-slate-700 cursor-grab active:cursor-grabbing flex-shrink-0"
                onMouseEnter={() => setDraggableCardId(query.id)}
                onMouseLeave={() => setDraggableCardId(null)}
                title="Drag Row"
              >
                <GripVertical size={16} />
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
              {getInitials(query.name)}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm leading-tight truncate max-w-[150px]">{query.name}</h4>
              <div className="text-[10px] font-medium text-slate-800 mt-0.5">#{query.id + 2500000}</div>
            </div>
          </div>
        </td>

        {/* Contact */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-800">
            <Phone size={12} className="text-slate-800" /> {query.phone}
          </div>
        </td>

        {/* Trip Details */}
        <td className="px-4 py-3">
          {query.destination ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-800">
              <MapPin size={12} className="text-blue-500" />
              <span className="font-medium truncate max-w-[120px]">{query.destination}</span>
              {query.numDays && <span className="text-slate-800 ml-1">({query.numDays}D)</span>}
            </div>
          ) : (
            <span className="text-xs text-slate-800 italic">Not specified</span>
          )}
        </td>

        {/* Assigned To */}
        <td className="px-4 py-3">
          {query.assignedTo ? (
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md w-fit border border-indigo-100">
              <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold">
                {getInitials(query.assignedTo.name || '')}
              </div>
              <span className="text-[11px] font-bold truncate max-w-[100px]">{query.assignedTo.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md w-fit border border-slate-200">
              <span className="text-[11px] font-bold">Unassigned</span>
            </div>
          )}
        </td>

        {/* Status (Table View Only) */}
        {!isBoard && (
          <td className="px-4 py-3">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusDropdownId(statusDropdownId === query.id ? null : query.id);
                }}
                className={`flex items-center justify-between gap-2 px-2.5 py-1 rounded-md text-xs font-medium border ${currentStage.headerBg} ${currentStage.textColor} ${currentStage.border} hover:opacity-80 transition-opacity w-32`}
              >
                <span className="truncate">{currentStage.label}</span>
                <ChevronDown size={14} className="flex-shrink-0" />
              </button>

              {statusDropdownId === query.id && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="py-1">
                    {STAGES.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setStatusDropdownId(null);
                          if (s.id !== query.status) updateQueryStatus(query.id, s.id);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-2 ${s.id === query.status ? 'bg-slate-50 text-slate-800' : 'text-slate-800 hover:bg-slate-50 hover:text-slate-800'}`}
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
        )}

        {/* Updated */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded w-fit font-medium border border-amber-200/50">
            <Clock size={10} /> {new Date(query.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors z-10">
          <div className="flex items-center justify-end gap-2">
            <button className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-emerald-100 hover:border-emerald-500" title="WhatsApp" onClick={() => { if (query.phone) window.open(`https://wa.me/${query.phone.replace(/\D/g, '')}`, '_blank'); }}>
              <MessageCircle size={13} />
            </button>
            <button className="w-7 h-7 rounded bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-blue-100 hover:border-blue-600" title="Call" onClick={() => { if (query.phone) window.open(`tel:${query.phone}`, '_self'); }}>
              <Phone size={13} />
            </button>
            <button
              onClick={() => handleOpenQuotation(query)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-white hover:bg-slate-700 transition-colors text-[10px] font-medium shadow-sm ml-1"
            >
              <FileText size={12} />
              Quote
            </button>

            <div className="relative flex items-center">
              <button
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${openDropdownId === query.id ? 'bg-blue-100 text-blue-600' : 'text-slate-800 hover:text-slate-700 hover:bg-slate-100'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (openDropdownId === query.id) {
                    setOpenDropdownId(null);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDropdownPos({
                      top: Math.round(rect.bottom + 4),
                      right: Math.round(window.innerWidth - rect.right)
                    });
                    setOpenDropdownId(query.id);
                  }
                }}
              >
                <MoreVertical size={16} />
              </button>
              {openDropdownId === query.id && createPortal(
                <div
                  className="fixed w-36 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-200 text-left"
                  style={{ top: `${dropdownPos.top}px`, right: `${dropdownPos.right}px` }}
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
        </td>
      </tr>
    );
  };

  const filteredQueries = queries.filter(q => {
    let match = true;
    if (appliedFilters.customerName && !q.name?.toLowerCase().includes(appliedFilters.customerName.toLowerCase())) match = false;
    if (appliedFilters.customerMobile && !q.phone?.includes(appliedFilters.customerMobile)) match = false;
    if (appliedFilters.destination && !q.destination?.toLowerCase().includes(appliedFilters.destination.toLowerCase())) match = false;
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 flex-shrink-0">
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
                label="Assigned To"
                placeholder="Any Owner"
                value={filters.assignedTo}
                onChange={(val) => setFilters({ ...filters, assignedTo: val })}
                options={users.map(u => ({ value: u.id, label: u.name }))}
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
            <div className="flex flex-col gap-6 w-full">
              {STAGES.map(stage => {
                const stageQueries = filteredQueries.filter(q => q.status === stage.id);
                const isDragOver = dragOverStage === stage.id;

                return (
                  <div
                    key={stage.id}
                    className={`w-full flex flex-col rounded-xl transition-colors duration-200 ${isDragOver ? 'bg-slate-100/80 ring-2 ring-blue-400 ring-inset' : 'bg-slate-50/60 border border-slate-200'}`}
                    onDragOver={(e) => handleDragOver(e, stage.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
                    {/* Section Header */}
                    <div className={`px-5 py-3 border-b ${stage.border} ${stage.headerBg} rounded-t-xl flex justify-between items-center shadow-sm`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`}></div>
                        <span className={`font-semibold text-sm ${stage.textColor}`}>{stage.label}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold bg-white shadow-sm ${stage.textColor}`}>
                        {stageQueries.length} Leads
                      </span>
                    </div>

                    {/* Section Body (Grid View) */}
                    <div className="p-0 min-h-[120px]">
                      {stageQueries.length > 0 ? (

                        <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider w-1/4">Client</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Contact</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Trip Details</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Assigned To</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Updated</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {stageQueries.map(query => renderQueryRow(query, true))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-24 text-slate-800 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/50 m-4 hover:bg-slate-100 transition-colors">
                          <span className="text-xs font-medium">Drop queries here to move to {stage.label}</span>
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
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider w-1/4">Client</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Trip Details</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Assigned To</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Updated</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-right sticky right-0 bg-slate-50 z-20 min-w-[80px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQueries.length > 0 ? (
                      filteredQueries.map(query => renderQueryRow(query, false))
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
