import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { Phone, MapPin, MessageCircle, FileText, Clock, IndianRupee, Search, CheckCircle2, ChevronDown, Filter, Calendar } from 'lucide-react';
import api from '../../api/axios';
import SendQuotationModal from './SendQuotationModal';

const CustomSelect = ({ label, options, value, onChange, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
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
          <span className={value ? 'text-slate-900' : 'text-slate-850'}>{selectedOption ? selectedOption.label : placeholder}</span>
          <div className={`text-slate-750 transition-transform duration-305 ${isOpen ? '-rotate-180' : ''}`}>
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

const ConfirmedClients = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { subscribe } = useWebSocket();
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuotationQuery, setSelectedQuotationQuery] = useState(null);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter States
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    customerName: '',
    customerMobile: '',
    branch: '',
    assignedTo: '',
    fromDate: '',
    toDate: ''
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
      customerName: '', customerMobile: '', branch: '', assignedTo: '', fromDate: '', toDate: ''
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, appliedFilters]);

  const fetchQueries = async () => {
    try {
      const response = await api.get('/crm/leads');
      const data = response.data;
      if (data.success) {
        // Filter only PAYMENT_RECEIVED, WON, and BOOKING_CONFIRMED
        let confirmed = data.data.filter(q => q.status === 'PAYMENT_RECEIVED' || q.status === 'WON' || q.status === 'BOOKING_CONFIRMED');
        
        // Filter by Sales Role (Executive/Sales) - show only their own queries
        const userRole = user?.role?.toUpperCase();
        if (userRole === 'SALES_EXECUTIVE' || userRole === 'SALES') {
          confirmed = confirmed.filter(q => q.assignedToId === user.id);
        }
        
        setQueries(confirmed);
      }
    } catch (err) {
      console.error('Error fetching queries:', err);
    } finally {
      setIsLoading(false);
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

  // Real-time: refetch confirmed queries when updates happen
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

  const handleOpenQuotation = (query) => {
    setSelectedQuotationQuery(query);
    setIsQuotationModalOpen(true);
  };

  const handleCloseQuotation = () => {
    setIsQuotationModalOpen(false);
    setSelectedQuotationQuery(null);
  };

  const updateQueryStatus = async (queryId, newStatus) => {
    setQueries(prev => prev.map(q => q.id === queryId ? { ...q, status: newStatus } : q));
    try {
      const res = await api.put(`/crm/leads/${queryId}`, { status: newStatus });
      if (!res.data.success) {
        fetchQueries();
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      fetchQueries();
    }
  };

  const filteredQueries = queries.filter(q => {
    let match = true;
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      if (!q.name?.toLowerCase().includes(s) && !q.phone?.includes(s)) match = false;
    }
    if (appliedFilters.customerName && !q.name?.toLowerCase().includes(appliedFilters.customerName.toLowerCase())) match = false;
    if (appliedFilters.customerMobile && !q.phone?.includes(appliedFilters.customerMobile)) match = false;
    if (appliedFilters.branch && q.branchId !== parseInt(appliedFilters.branch)) match = false;
    if (appliedFilters.assignedTo && q.assignedTo?.id !== parseInt(appliedFilters.assignedTo)) match = false;
    if (appliedFilters.fromDate && new Date(q.createdAt) < new Date(appliedFilters.fromDate)) match = false;
    if (appliedFilters.toDate && new Date(q.createdAt) > new Date(appliedFilters.toDate + 'T23:59:59')) match = false;
    return match;
  });

  const totalPages = Math.ceil(filteredQueries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQueries = filteredQueries.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Confirmed Clients
            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-indigo-200">
              {filteredQueries.length}
            </span>
          </h1>
          <p className="text-sm text-slate-700 mt-1">Manage and track bookings and payments</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-800" size={16} />
            <input 
              type="text" 
              placeholder="Search client..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white w-64 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="px-6 pt-4 flex-shrink-0">
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-300 ${isFilterExpanded ? '' : 'overflow-hidden'}`}>
          <div
            className={`px-5 py-3 cursor-pointer flex justify-between items-center transition-colors ${isFilterExpanded ? 'bg-blue-50/50 border-b border-slate-100' : 'hover:bg-slate-50'}`}
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            <div className="flex items-center gap-2.5 text-blue-800 font-bold text-sm tracking-wide">
              <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                <Filter size={14} strokeWidth={2.5} />
              </div>
              FILTER RESULTS
            </div>
            <button className="text-slate-805 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded-full">
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
                {user?.role !== 'SALES_EXECUTIVE' && user?.role !== 'SALES' && (
                  <>
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
                  </>
                )}
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
      </div>

      {/* Main Content - Table */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 bg-slate-50/80 uppercase font-semibold sticky top-0 z-20">
                <tr>
                  <th className="px-5 py-4 border-b border-slate-200 w-64">Client Details</th>
                  <th className="px-5 py-4 border-b border-slate-200 w-48">Trip Info</th>
                  <th className="px-5 py-4 border-b border-slate-200 w-40">Status</th>
                  <th className="px-5 py-4 border-b border-slate-200 min-w-[200px]">Latest Note</th>
                  <th className="px-5 py-4 border-b border-slate-200 text-right sticky right-0 bg-slate-50/80 z-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-slate-700">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle2 className="w-12 h-12 text-slate-200 mb-3" />
                        <p className="text-base font-medium text-slate-800">No confirmed clients found</p>
                        <p className="text-sm mt-1">Queries moved to Booking Confirmed will appear here.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentQueries.map((query) => {
                    const latestNote = query.notes && query.notes.length > 0 
                      ? query.notes.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0] 
                      : null;
                      
                    return (
                      <tr key={query.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {query.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-[13px]">{query.name}</div>
                              <div className="text-slate-700 text-[11px] mt-0.5 flex items-center gap-1.5">
                                <span className="flex items-center gap-1"><Phone size={10} /> {query.phone}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-5 py-4">
                          {query.destination ? (
                            <div>
                              <div className="font-medium text-slate-700 text-[13px] flex items-center gap-1.5">
                                <MapPin size={12} className="text-indigo-500" />
                                {query.destination}
                              </div>
                              <div className="text-slate-700 text-[11px] mt-1 flex gap-2">
                                {query.travelDate && <span>{new Date(query.travelDate).toLocaleDateString('en-GB')}</span>}
                                {query.pax && <span>• {query.pax} Pax</span>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-800 italic text-xs">Not specified</span>
                          )}
                        </td>
                        
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            query.status === 'PAYMENT_RECEIVED' 
                              ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {query.status === 'PAYMENT_RECEIVED' ? 'Payment Received' : 'Booking Confirmed'}
                          </span>
                        </td>
                        
                        <td className="px-5 py-4">
                          {latestNote ? (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 max-w-sm">
                              <p className="text-[12px] text-slate-700 leading-relaxed line-clamp-2" title={latestNote.content}>
                                {latestNote.content}
                              </p>
                              <div className="text-[10px] text-slate-800 mt-1 flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(latestNote.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-800 italic text-xs">No notes added yet</span>
                          )}
                        </td>
                        
                        <td className="px-5 py-4 text-right sticky right-0 bg-white group-hover:bg-indigo-50/30 transition-colors z-10">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-emerald-100 hover:border-emerald-500" 
                              title="WhatsApp" 
                              onClick={() => { if (query.phone) window.open(`https://wa.me/${query.phone.replace(/\D/g, '')}`, '_blank'); }}
                            >
                              <MessageCircle size={14} />
                            </button>
                            <button 
                              className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-blue-100 hover:border-blue-600" 
                              title="Call" 
                              onClick={() => { if (query.phone) window.open(`tel:${query.phone}`, '_self'); }}
                            >
                              <Phone size={14} />
                            </button>
                            <button 
                              onClick={() => navigate(`/crm/queries/${query.id}`, { state: { lead: query } })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors text-[11px] font-medium shadow-sm ml-1"
                            >
                              <FileText size={14} />
                              View Full Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredQueries.length > itemsPerPage && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-semibold rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-semibold rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-slate-700">
                    Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-slate-800">{Math.min(endIndex, filteredQueries.length)}</span> of{' '}
                    <span className="font-semibold text-slate-800">{filteredQueries.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      &larr;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-semibold ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 font-bold'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <SendQuotationModal 
        isOpen={isQuotationModalOpen}
        onClose={handleCloseQuotation}
        query={selectedQuotationQuery}
        onStatusUpdate={updateQueryStatus}
      />
    </div>
  );
};

export default ConfirmedClients;
