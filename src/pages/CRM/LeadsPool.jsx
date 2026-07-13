import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, MessageSquare, Edit2, Search, FileText, Briefcase, MoreVertical } from 'lucide-react';
import FollowUpModal from './FollowUpModal';
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
          <span className={value ? 'text-slate-900' : 'text-slate-400'}>{selectedOption ? selectedOption.label : placeholder}</span>
          <div className={`text-slate-500 transition-transform duration-300 ${isOpen ? '-rotate-180' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
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

const LeadsPool = () => {
  const { user, token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('In Process'); // 'In Process', 'Callback Leads', 'Overall Leads', 'Un-Assigned'
  
  // Bulk Assign State
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [bulkAssignTarget, setBulkAssignTarget] = useState("");
  const [assignMode, setAssignMode] = useState("BRANCH"); // 'BRANCH' or 'EXECUTIVE'
  const [bulkAssignBranch, setBulkAssignBranch] = useState("");
  const [bulkAssignSearch, setBulkAssignSearch] = useState("");
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [branches, setBranches] = useState([]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isClosingEdit, setIsClosingEdit] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const handleCloseEditModal = () => {
    setIsClosingEdit(true);
    setTimeout(() => {
      setIsClosingEdit(false);
      setIsEditModalOpen(false);
    }, 280);
  };

  const [isClosingBulk, setIsClosingBulk] = useState(false);
  
  const handleCloseBulkAssignModal = () => {
    setIsClosingBulk(true);
    setTimeout(() => {
      setIsClosingBulk(false);
      setIsBulkAssignModalOpen(false);
    }, 280);
  };

  // Dropdown State
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId !== null) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  // Follow Up Modal State
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [activeFollowUpLead, setActiveFollowUpLead] = useState(null);

  // Quotation Modal State
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [selectedQuotationLead, setSelectedQuotationLead] = useState(null);

  // View Details Modal State
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isClosingViewDetails, setIsClosingViewDetails] = useState(false);
  const [activeViewLead, setActiveViewLead] = useState(null);

  const handleCloseViewDetails = () => {
    setIsClosingViewDetails(true);
    setTimeout(() => {
      setIsClosingViewDetails(false);
      setIsViewDetailsOpen(false);
      setActiveViewLead(null);
    }, 280);
  };

  // Comments Modal State
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isClosingComments, setIsClosingComments] = useState(false);
  const [activeCommentsLead, setActiveCommentsLead] = useState(null);
  const [newComment, setNewComment] = useState("");

  const handleCloseComments = () => {
    setIsClosingComments(true);
    setTimeout(() => {
      setIsClosingComments(false);
      setIsCommentsOpen(false);
      setActiveCommentsLead(null);
      setNewComment("");
    }, 280);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activeCommentsLead) return;

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/crm/leads/${activeCommentsLead.id}/notes`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment })
      });
      const data = await res.json();
      if (data.success) {
        setActiveCommentsLead(prev => ({
          ...prev,
          notes: [...(prev.notes || []), data.data]
        }));
        setNewComment("");
        fetchLeads();
      } else {
        alert('Failed to add comment');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding comment');
    }
  };

  // Filter States
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    leadType: '',
    leadStage: '',
    leadSource: '',
    customerName: '',
    customerMobile: '',
    customerEmail: '',
    destination: '',
    assignedTo: '',
    fromDate: '',
    toDate: '',
    unAssigned: false
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const fetchLeads = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/crm/leads?type=LEAD', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDestinations = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/destinations');
      const data = await response.json();
      if (data.success) {
        setDestinations(data.data?.destinations || []);
      }
    } catch (err) {
      console.error('Error fetching destinations:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/branches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setBranches(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLeads();
      fetchDestinations();
      fetchUsers();
      fetchBranches();
    }
  }, [token]);

  const handleFollowUpClick = (lead) => {
    setActiveFollowUpLead(lead);
    setIsFollowUpModalOpen(true);
  };

  const handleOpenQuotation = (lead) => {
    setSelectedQuotationLead(lead);
    setIsQuotationModalOpen(true);
  };

  const handleEditClick = (lead) => {
    // Convert date string to YYYY-MM-DD for input[type="date"]
    let formattedDate = '';
    if (lead.travelDate) {
      formattedDate = new Date(lead.travelDate).toISOString().split('T')[0];
    }
    
    setEditingLead({
      ...lead,
      travelDate: formattedDate
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/crm/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingLead.name,
          phone: editingLead.phone,
          email: editingLead.email,
          travelDate: editingLead.travelDate || null,
          pax: editingLead.pax || null,
          numDays: editingLead.numDays || null,
          destination: editingLead.destination
        })
      });
      const data = await res.json();
      if (data.success) {
        handleCloseEditModal();
        fetchLeads();
      } else {
        alert('Failed to update lead');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating lead');
    }
  };

  // Helper function to format Lead Date age (e.g. "8 Month 28 Days")
  const getAge = (dateString) => {
    const created = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays < 30) return `${diffDays} Days`;
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return `${months} Month ${days} Days`;
  };

  // Filter leads based on active tab and applied filters
  const filteredLeads = leads.filter(lead => {
    // 1. Tab filtering
    if (activeTab === 'Un-Assigned' && lead.assignedToId) return false;
    if (activeTab === 'In Process' && !['NEW', 'ASSIGNED'].includes(lead.status)) return false;

    // 2. Applied Filters logic
    if (appliedFilters.leadType && lead.leadCategory && lead.leadCategory.toLowerCase() !== appliedFilters.leadType.toLowerCase()) return false;
    if (appliedFilters.leadStage && lead.status !== appliedFilters.leadStage) return false;
    if (appliedFilters.leadSource && lead.source && lead.source.toLowerCase() !== appliedFilters.leadSource.toLowerCase()) return false;
    if (appliedFilters.customerName && !lead.name?.toLowerCase().includes(appliedFilters.customerName.toLowerCase())) return false;
    if (appliedFilters.customerMobile && !lead.phone?.includes(appliedFilters.customerMobile)) return false;
    if (appliedFilters.customerEmail && !lead.email?.toLowerCase().includes(appliedFilters.customerEmail.toLowerCase())) return false;
    if (appliedFilters.destination && !lead.destination?.toLowerCase().includes(appliedFilters.destination.toLowerCase())) return false;
    if (appliedFilters.assignedTo && lead.assignedToId !== parseInt(appliedFilters.assignedTo)) return false;
    if (appliedFilters.unAssigned && lead.assignedToId) return false;
    
    if (appliedFilters.fromDate) {
      const from = new Date(appliedFilters.fromDate);
      from.setHours(0, 0, 0, 0);
      const leadDate = new Date(lead.createdAt);
      if (leadDate < from) return false;
    }
    if (appliedFilters.toDate) {
      const to = new Date(appliedFilters.toDate);
      to.setHours(23, 59, 59, 999);
      const leadDate = new Date(lead.createdAt);
      if (leadDate > to) return false;
    }

    return true;
  });

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(filteredLeads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (id) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(leadId => leadId !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const handleOpenBulkAssignModal = () => {
    if (user?.role === 'BRANCH_MANAGER') {
      setAssignMode('EXECUTIVE');
      setBulkAssignBranch(user?.branchId?.toString());
    } else {
      setAssignMode('BRANCH');
      setBulkAssignBranch("");
    }
    setBulkAssignTarget("");
    setBulkAssignSearch("");
    setIsBulkAssignModalOpen(true);
  };

  const handleBulkAssignSubmit = async () => {
    if (assignMode === "EXECUTIVE" && !bulkAssignTarget) return alert("Please select an executive.");
    if (assignMode === "BRANCH" && !bulkAssignBranch) return alert("Please select a branch.");
    
    setIsBulkAssigning(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/crm/leads/bulk-assign', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          leadIds: selectedLeads,
          assignedToId: assignMode === "EXECUTIVE" ? bulkAssignTarget : null,
          branchId: bulkAssignBranch
        })
      });
      const data = await response.json();
      if (data.success) {
        handleCloseBulkAssignModal();
        setBulkAssignTarget("");
        setBulkAssignBranch("");
        setBulkAssignSearch("");
        setSelectedLeads([]);
        fetchLeads();
      } else {
        alert(data.message || "Failed to assign leads");
      }
    } catch (err) {
      console.error(err);
      alert("Error assigning leads");
    } finally {
      setIsBulkAssigning(false);
    }
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      leadType: '', leadStage: '', leadSource: '',
      customerName: '', customerMobile: '', customerEmail: '',
      destination: '', assignedTo: '', fromDate: '', toDate: '', unAssigned: false
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  return (
    <div className="space-y-4">
      {/* Filter Results Section */}
      {/* Filter Results Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
        <div 
          className={`px-5 py-3.5 cursor-pointer flex justify-between items-center transition-colors ${isFilterExpanded ? 'bg-blue-50/50 border-b border-slate-100' : 'hover:bg-slate-50'}`}
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div className="flex items-center gap-2.5 text-blue-800 font-bold text-sm tracking-wide">
            <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            </div>
            FILTER RESULTS
          </div>
          <button className="text-slate-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded-full">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform duration-300 ${!isFilterExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </div>
        
        {isFilterExpanded && (
          <div className="p-5 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
              {/* Row 1 */}
              <CustomSelect 
                label="Select Lead Type"
                placeholder="All Types"
                value={filters.leadType}
                onChange={(val) => setFilters({...filters, leadType: val})}
                options={[
                  { value: 'B2B', label: 'B2B' },
                  { value: 'B2C', label: 'B2C' },
                  { value: 'Corporate', label: 'Corporate' }
                ]}
              />
              <CustomSelect 
                label="Select Lead Stage"
                placeholder="All Stages"
                value={filters.leadStage}
                onChange={(val) => setFilters({...filters, leadStage: val})}
                options={[
                  { value: 'NEW', label: 'New' },
                  { value: 'ASSIGNED', label: 'Assigned' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'WON', label: 'Won' },
                  { value: 'LOST', label: 'Lost' },
                  { value: 'NOT_INTERESTED', label: 'Not Interested' }
                ]}
              />
              <CustomSelect 
                label="Select Lead Source"
                placeholder="All Sources"
                value={filters.leadSource}
                onChange={(val) => setFilters({...filters, leadSource: val})}
                options={[
                  { value: 'FACEBOOK_AD', label: 'Facebook' },
                  { value: 'GOOGLE_AD', label: 'Google' },
                  { value: 'WEBSITE', label: 'Website' },
                  { value: 'REFERRAL', label: 'Referral' },
                  { value: 'OTHER', label: 'Other' }
                ]}
              />
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Name</label>
                <input 
                  type="text" placeholder="Search by name..." value={filters.customerName} onChange={e => setFilters({...filters, customerName: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>

              {/* Row 2 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Mobile</label>
                <input 
                  type="text" placeholder="Search by mobile..." value={filters.customerMobile} onChange={e => setFilters({...filters, customerMobile: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Email</label>
                <input 
                  type="text" placeholder="Search by email..." value={filters.customerEmail} onChange={e => setFilters({...filters, customerEmail: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Source/Destination</label>
                <input 
                  type="text" placeholder="E.g. Sikkim, Dubai" value={filters.destination} onChange={e => setFilters({...filters, destination: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <CustomSelect 
                label="Assigned To"
                placeholder="Any Owner"
                value={filters.assignedTo}
                onChange={(val) => setFilters({...filters, assignedTo: val})}
                options={users.map(u => ({ value: u.id, label: u.name }))}
              />

              {/* Row 3 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">From Date</label>
                <input 
                  type="date" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">To Date</label>
                <input 
                  type="date" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={filters.unAssigned} 
                    onChange={e => setFilters({...filters, unAssigned: e.target.checked})}
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

      {/* Tabs Row */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex space-x-2">
          {['In Process', 'Callback Leads', 'Overall Leads', 'Un-Assigned'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium border rounded-md transition-colors ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="font-semibold text-slate-700 text-sm">
          Total Record Found: {filteredLeads.length}
        </div>
      </div>

      {/* Floating Action Bar for Bulk Select */}
      {selectedLeads.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between animate-in fade-in shadow-sm">
          <div className="text-blue-800 font-semibold text-sm">
            {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
          </div>
          <button
            onClick={handleOpenBulkAssignModal}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-sm transition-colors shadow-sm"
          >
            Assign Selected
          </button>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto overflow-y-hidden relative">
        <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold shadow-sm">
              <th className="px-2 py-2 w-8 text-center">
                <input 
                  type="checkbox" 
                  checked={filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length}
                  onChange={handleSelectAll}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 cursor-pointer" 
                />
              </th>
              <th className="px-2 py-2 border-l border-slate-200 min-w-[120px]">Lead Date</th>
              <th className="px-2 py-2 border-l border-slate-200 min-w-[180px]">Customer Details</th>
              <th className="px-2 py-2 border-l border-slate-200">Type / Source</th>
              <th className="px-2 py-2 border-l border-slate-200">Travel Date</th>
              <th className="px-2 py-2 border-l border-slate-200">No. of Pax</th>
              <th className="px-2 py-2 border-l border-slate-200">No. of Days</th>
              <th className="px-2 py-2 border-l border-slate-200 min-w-[120px]">Destinations</th>
              <th className="px-2 py-2 border-l border-slate-200">Lead Stage</th>
              <th className="px-2 py-2 border-l border-slate-200">Remark</th>
              <th className="px-2 py-2 border-l border-slate-200">Last Updated</th>
              <th className="px-2 py-2 border-l border-slate-200">Owner</th>
              <th className="px-2 py-2 border-l border-slate-200 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan="13" className="p-4 text-center text-slate-500">Loading leads...</td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan="13" className="p-4 text-center text-slate-500">No records found.</td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className={`align-top ${selectedLeads.includes(lead.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                  <td className="px-2 py-2.5 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => handleSelectLead(lead.id)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 outline-none cursor-pointer" 
                    />
                  </td>
                  <td className="px-2 py-2.5 border-l border-slate-200">
                    <div className="text-slate-700 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                    </div>
                    <div className="text-slate-500 text-[10px] mt-0.5">{getAge(lead.createdAt)}</div>
                    <div className="text-slate-500 text-[10px] mt-0.5">{lead.id + 2500000}</div>
                  </td>
                  <td className="px-2 py-2.5 border-l border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <span className="text-slate-400">👤</span> {lead.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="text-slate-400">📞</span> {lead.phone} 
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="text-slate-400">✉️</span> {lead.email}
                      </div>
                    )}
                    {lead.isDuplicate && (
                      <div className="text-red-500 text-[10px] font-medium mt-0.5">(Duplicate)</div>
                    )}
                  </td>
                  <td className="px-2 py-2.5 border-l border-slate-200 text-slate-700">
                    <div>{lead.leadCategory?.split(' ')[0] || 'Package'}</div>
                    <div>{lead.leadCategory?.split(' ')[1] || 'B2C'}</div>
                    <div className="text-slate-500">{lead.source}</div>
                  </td>
                  <td className="px-2 py-2.5 border-l border-slate-200 text-slate-700">
                    {lead.travelDate ? new Date(lead.travelDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : 'NA'}
                  </td>
                  <td className="px-2 py-2.5 border-l border-slate-200 text-slate-700 text-center">
                    {lead.pax || 'NA'}
                  </td>
                  <td className="px-2 py-2.5 border-l border-slate-200 text-slate-700 text-center">
                    {lead.numDays || 'NA'}
                  </td>
                  <td className="px-2 py-2.5 border-l border-slate-200 text-slate-700 font-medium">
                    {lead.destination || 'Not Specified'}
                  </td>
                  <td className="px-2 py-2.5 border-l border-slate-200">
                    <div className="text-slate-700 mb-1">{lead.status === 'NEW' ? 'New' : lead.status}</div>
                    <button 
                      onClick={() => handleFollowUpClick(lead)}
                      className="bg-[#ff5722] hover:bg-[#f4511e] text-white text-[10px] font-semibold px-2 py-1 rounded shadow-sm transition-colors"
                    >
                      Follow Up
                    </button>
                  </td>
                  <td className="px-2 py-2.5 border-l border-slate-200 text-slate-700 text-[10px] min-w-[200px] max-w-[250px]">
                    {lead.notes && lead.notes.length > 0 ? (
                      <div 
                        className="whitespace-pre-wrap line-clamp-2 hover:line-clamp-none cursor-pointer transition-all duration-300"
                        title="Hover to read full remark"
                      >
                        {lead.notes[lead.notes.length - 1].content}
                      </div>
                    ) : (
                      <span className="text-slate-400">NA</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 border-l border-slate-200 text-slate-700 whitespace-nowrap">
                    {new Date(lead.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-2 py-2.5 border-l border-slate-200">
                    <div className="text-slate-700 whitespace-nowrap">{lead.assignedTo?.name || 'Unassigned'}</div>
                  </td>
                  <td className="px-2 py-2.5 border-l border-slate-200">
                    <div className="relative inline-block text-left w-full text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === lead.id ? null : lead.id);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors" 
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openDropdownId === lead.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-100 text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(lead);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          >
                            <Edit2 size={12} className="text-blue-500" /> Edit Lead
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenQuotation(lead);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          >
                            <FileText size={12} className="text-emerald-500" /> Send Quotation
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveViewLead(lead);
                              setIsViewDetailsOpen(true);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          >
                            <Eye size={12} className="text-indigo-500" /> View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCommentsLead(lead);
                              setIsCommentsOpen(true);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          >
                            <MessageSquare size={12} className="text-purple-500" /> Comments
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Lead Modal */}
      {isEditModalOpen && createPortal(
        <div className={`fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm ${isClosingEdit ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto ${isClosingEdit ? 'animate-slide-out-left' : 'animate-slide-in-left'}`}>
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800">Complete Lead Details</h3>
              <button onClick={handleCloseEditModal} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md p-1 transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleUpdateLead} className="p-5 space-y-3.5">
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Customer Name</label>
                <input 
                  type="text" 
                  value={editingLead?.name || ''}
                  onChange={(e) => setEditingLead({...editingLead, name: e.target.value})}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Phone Number</label>
                  <input 
                    type="text" 
                    value={editingLead?.phone || ''}
                    onChange={(e) => setEditingLead({...editingLead, phone: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    value={editingLead?.email || ''}
                    onChange={(e) => setEditingLead({...editingLead, email: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2"></div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Destination</label>
                <select
                  value={editingLead?.destination || ''}
                  onChange={(e) => setEditingLead({...editingLead, destination: e.target.value})}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                >
                  <option value="">Select a Destination</option>
                  {destinations.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                  {/* Fallback if the current destination is not in the list */}
                  {editingLead?.destination && !destinations.some(d => d.name === editingLead.destination) && (
                    <option value={editingLead.destination}>{editingLead.destination}</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Travel Date</label>
                  <input 
                    type="date" 
                    value={editingLead?.travelDate || ''}
                    onChange={(e) => setEditingLead({...editingLead, travelDate: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Pax</label>
                    <input 
                      type="number" 
                      min="1"
                      value={editingLead?.pax || ''}
                      onChange={(e) => setEditingLead({...editingLead, pax: e.target.value})}
                      placeholder="e.g. 2"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Days</label>
                    <input 
                      type="number" 
                      min="1"
                      value={editingLead?.numDays || ''}
                      onChange={(e) => setEditingLead({...editingLead, numDays: e.target.value})}
                      placeholder="e.g. 5"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-2.5">
                <button type="button" onClick={handleCloseEditModal} className="px-4 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200">
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

      {/* Detailed Follow Up Modal */}
      <FollowUpModal 
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        lead={activeFollowUpLead}
        token={token}
        onFollowUpSaved={fetchLeads}
      />

      <SendQuotationModal 
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        query={selectedQuotationLead}
      />

      {/* Bulk Assign Modal */}
      {isBulkAssignModalOpen && createPortal(
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm ${isClosingBulk ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-visible ${isClosingBulk ? 'animate-slide-out-left' : 'animate-slide-in-left'} border border-slate-100 flex flex-col max-h-[90vh]`}>
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-lg">Bulk Assign Leads</h3>
              <button onClick={handleCloseBulkAssignModal} className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-200 rounded-full transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 overflow-visible min-h-0 flex-1 flex flex-col">
              <div className="mb-6 text-base text-slate-600">
                You are about to assign <strong className="text-blue-600 text-lg">{selectedLeads.length}</strong> selected lead(s) to a new owner.
              </div>
              
              {/* Assignment Mode Selection */}
              {user?.role !== 'BRANCH_MANAGER' && (
                <div className="flex gap-4 mb-6">
                  <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${assignMode === 'BRANCH' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}>
                    <input 
                      type="radio" 
                      name="assignMode" 
                      checked={assignMode === 'BRANCH'} 
                      onChange={() => setAssignMode('BRANCH')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Assign to Branch</div>
                      <div className="text-xs text-slate-500 mt-0.5">Leads will be added to the branch unassigned pool</div>
                    </div>
                  </label>
                  
                  <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${assignMode === 'EXECUTIVE' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}>
                    <input 
                      type="radio" 
                      name="assignMode" 
                      checked={assignMode === 'EXECUTIVE'} 
                      onChange={() => setAssignMode('EXECUTIVE')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Assign to Sales Executive</div>
                      <div className="text-xs text-slate-500 mt-0.5">Assign leads directly to a specific person</div>
                    </div>
                  </label>
                </div>
              )}
              
              <div className={`grid ${assignMode === 'EXECUTIVE' && user?.role !== 'BRANCH_MANAGER' ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-4`}>
                {user?.role !== 'BRANCH_MANAGER' && (
                  <CustomSelect 
                    label="Select Branch"
                    placeholder="Choose a branch..."
                    value={bulkAssignBranch}
                    onChange={(val) => {
                      setBulkAssignBranch(val);
                      setBulkAssignTarget("");
                    }}
                    options={branches.map(b => ({ value: b.id.toString(), label: b.name }))}
                  />
                )}
                
                {assignMode === 'EXECUTIVE' && (
                  <div className="relative flex flex-col justify-end">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Search Executive
                    </label>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={bulkAssignSearch}
                        onChange={(e) => setBulkAssignSearch(e.target.value)}
                        placeholder="Search name or email..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm bg-slate-50 focus:bg-white transition-all"
                        disabled={!bulkAssignBranch}
                      />
                    </div>
                  </div>
                )}
              </div>

              {assignMode === 'EXECUTIVE' && (
                bulkAssignBranch ? (
                  <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="overflow-y-auto bg-white flex-1 min-h-0">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="uppercase tracking-wider border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 w-12 text-center">Select</th>
                            <th className="px-4 py-3">Executive Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {users
                            .filter(u => u.branchId?.toString() === bulkAssignBranch)
                            .filter(u => {
                              if (!bulkAssignSearch) return true;
                              const s = bulkAssignSearch.toLowerCase();
                              return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
                            })
                            .map(u => (
                            <tr 
                              key={u.id} 
                              className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${bulkAssignTarget === u.id.toString() ? 'bg-blue-50' : ''}`}
                              onClick={() => setBulkAssignTarget(u.id.toString())}
                            >
                              <td className="px-4 py-3 text-center">
                                <input 
                                  type="radio" 
                                  name="bulkAssignUser"
                                  checked={bulkAssignTarget === u.id.toString()} 
                                  onChange={() => setBulkAssignTarget(u.id.toString())}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {u.name}
                              </td>
                              <td className="px-4 py-3 text-slate-500">
                                {u.email}
                              </td>
                              <td className="px-4 py-3 text-slate-500">
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {u.role.replace('_', ' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {users.filter(u => u.branchId?.toString() === bulkAssignBranch).length === 0 && (
                            <tr>
                              <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                                No sales executives found for this branch.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 border border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 flex-1">
                    <Briefcase size={32} className="mb-3 text-slate-400" />
                    <p className="text-sm font-medium">Select a branch to view executives</p>
                  </div>
                )
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/80 shrink-0 rounded-b-2xl">
              <button onClick={handleCloseBulkAssignModal} className="px-5 py-2 text-sm text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleBulkAssignSubmit} 
                disabled={isBulkAssigning || !bulkAssignBranch || (assignMode === 'EXECUTIVE' && !bulkAssignTarget)}
                className={`px-5 py-2 text-white text-sm font-bold rounded-lg transition-colors shadow-md ${isBulkAssigning || !bulkAssignBranch || (assignMode === 'EXECUTIVE' && !bulkAssignTarget) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}`}
              >
                {isBulkAssigning ? 'Assigning...' : `Assign ${selectedLeads.length} Leads`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* View Details Modal */}
      {isViewDetailsOpen && activeViewLead && createPortal(
        <div className={`fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm ${isClosingViewDetails ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col ${isClosingViewDetails ? 'animate-slide-out-left' : 'animate-slide-in-left'}`}>
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0 rounded-t-xl">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Eye size={16} className="text-indigo-500"/> Lead Details</h3>
              <button onClick={handleCloseViewDetails} className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-200 rounded-full transition-colors">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] text-slate-500 uppercase font-bold">Name</label><div className="text-sm text-slate-800">{activeViewLead.name}</div></div>
                <div><label className="text-[10px] text-slate-500 uppercase font-bold">Phone</label><div className="text-sm text-slate-800">{activeViewLead.phone}</div></div>
                <div><label className="text-[10px] text-slate-500 uppercase font-bold">Email</label><div className="text-sm text-slate-800">{activeViewLead.email || 'N/A'}</div></div>
                <div><label className="text-[10px] text-slate-500 uppercase font-bold">Destination</label><div className="text-sm text-slate-800">{activeViewLead.destination || 'N/A'}</div></div>
                <div><label className="text-[10px] text-slate-500 uppercase font-bold">Travel Date</label><div className="text-sm text-slate-800">{activeViewLead.travelDate ? new Date(activeViewLead.travelDate).toLocaleDateString('en-GB') : 'N/A'}</div></div>
                <div><label className="text-[10px] text-slate-500 uppercase font-bold">Pax</label><div className="text-sm text-slate-800">{activeViewLead.pax || 'N/A'}</div></div>
                <div><label className="text-[10px] text-slate-500 uppercase font-bold">Status</label><div className="text-sm text-slate-800">{activeViewLead.status}</div></div>
                <div><label className="text-[10px] text-slate-500 uppercase font-bold">Source</label><div className="text-sm text-slate-800">{activeViewLead.source}</div></div>
                {activeViewLead.notes && activeViewLead.notes.length > 0 && (
                  <div className="col-span-2 mt-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Latest Note</label>
                    <div className="text-sm text-slate-800 italic bg-slate-50 p-2 rounded border border-slate-100">{activeViewLead.notes[activeViewLead.notes.length - 1].content}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end shrink-0 bg-white rounded-b-xl">
              <button onClick={handleCloseViewDetails} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">Close</button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Comments Modal */}
      {isCommentsOpen && activeCommentsLead && createPortal(
        <div className={`fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm ${isClosingComments ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col ${isClosingComments ? 'animate-slide-out-left' : 'animate-slide-in-left'}`}>
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0 rounded-t-xl">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><MessageSquare size={16} className="text-purple-500"/> Comments & Notes</h3>
              <button onClick={handleCloseComments} className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-200 rounded-full transition-colors">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50">
              {(!activeCommentsLead.notes || activeCommentsLead.notes.length === 0) ? (
                <div className="text-center text-slate-500 text-sm py-4">No comments yet.</div>
              ) : (
                <div className="space-y-3">
                  {activeCommentsLead.notes.map((note, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      <div className="text-xs text-slate-500 mb-1 font-medium">{new Date(note.createdAt).toLocaleString('en-GB')}</div>
                      <div className="text-sm text-slate-800 whitespace-pre-wrap">{note.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 rounded-b-xl">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your comment here..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button type="submit" disabled={!newComment.trim()} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">Add</button>
              </form>
            </div>
          </div>
        </div>, document.body
      )}

    </div>
  );
};

export default LeadsPool;
