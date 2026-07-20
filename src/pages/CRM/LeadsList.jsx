import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { Eye, MessageSquare, Edit2, Search, FileText, Briefcase, MoreVertical, User, Mail, Phone, MapPin, Calendar, CheckCircle2, Clock, Map, ChevronDown, Filter, ChevronUp } from 'lucide-react';
import FollowUpModal from './FollowUpModal';
import SendQuotationModal from './SendQuotationModal';
import api from '../../api/axios';

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

const LeadsList = () => {
  const { user, token } = useAuth();
  const { subscribe } = useWebSocket();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('In Process'); // 'In Process', 'Callback Leads', 'Overall Leads', 'Un-Assigned'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  
  // Bulk Assign State
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [bulkAssignTarget, setBulkAssignTarget] = useState("");
  const [assignMode, setAssignMode] = useState("BRANCH"); // 'BRANCH' or 'EXECUTIVE'
  const [bulkAssignBranch, setBulkAssignBranch] = useState("");
  const [bulkAssignSearch, setBulkAssignSearch] = useState("");
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [branches, setBranches] = useState([]);
  const [strategy, setStrategy] = useState("ROUND_ROBIN");
  const [selectedExecutives, setSelectedExecutives] = useState([]);
  const [executivePriorities, setExecutivePriorities] = useState({});



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
      setStrategy("ROUND_ROBIN");
      setSelectedExecutives([]);
      setExecutivePriorities({});
    }, 280);
  };

  // Dropdown State
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0 });
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    const handleScroll = () => setOpenDropdownId(null);
    
    if (openDropdownId !== null) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true); // true for capture phase to catch div scrolls
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
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

  // Requirement Modal State
  const [isRequirementOpen, setIsRequirementOpen] = useState(false);
  const [isClosingRequirement, setIsClosingRequirement] = useState(false);
  const [activeRequirementLead, setActiveRequirementLead] = useState(null);

  const handleCloseRequirement = () => {
    setIsClosingRequirement(true);
    setTimeout(() => {
      setIsClosingRequirement(false);
      setIsRequirementOpen(false);
      setActiveRequirementLead(null);
    }, 280);
  };

  // Source Modal State
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isClosingSource, setIsClosingSource] = useState(false);
  const [activeSourceLead, setActiveSourceLead] = useState(null);

  const handleCloseSource = () => {
    setIsClosingSource(true);
    setTimeout(() => {
      setIsClosingSource(false);
      setIsSourceOpen(false);
      setActiveSourceLead(null);
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
      const res = await api.post(`/crm/leads/${activeCommentsLead.id}/notes`, { content: newComment });
      const data = res.data;
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

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return;
    try {
      const res = await api.delete(`/crm/leads/${leadId}`);
      if (res.data.success) {
        setLeads(leads.filter(l => l.id !== leadId));
        setFilteredLeads(filteredLeads.filter(l => l.id !== leadId));
        if (selectedLeads.includes(leadId)) {
          setSelectedLeads(selectedLeads.filter(id => id !== leadId));
        }
      } else {
        alert('Failed to delete lead');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting lead');
    }
  };

  // Filter States
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    leadType: '',
    leadStage: '',
    leadSource: '',
    customerName: '',
    customerMobile: '',
    customerEmail: '',
    destination: '',
    branch: '',
    assignedTo: '',
    fromDate: '',
    toDate: '',
    unAssigned: false
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, appliedFilters]);

  const fetchLeads = async () => {
    try {
      const response = await api.get('/crm/leads?type=LEAD');
      const data = response.data;
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
      const response = await api.get('/destinations');
      const data = response.data;
      if (data.success) {
        setDestinations(data.data?.destinations || []);
      }
    } catch (err) {
      console.error('Error fetching destinations:', err);
    }
  };

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

  useEffect(() => {
    if (token) {
      fetchLeads();
      fetchBranches();
      if (user?.role !== 'SALES_EXECUTIVE') {
        fetchUsers();
      }
    }
  }, [token, user]);

  // Real-time: refetch leads list when assignment or updates happen
  useEffect(() => {
    if (!subscribe) return;
    const unsubUpdate = subscribe('lead_updated', () => {
      fetchLeads();
    });
    const unsubAssign = subscribe('lead_assigned', () => {
      fetchLeads();
    });
    return () => {
      unsubUpdate();
      unsubAssign();
    };
  }, [subscribe]);

  // Lazy load branches only when Bulk Assign modal is opened
  useEffect(() => {
    if (token && isBulkAssignModalOpen && branches.length === 0) {
      fetchBranches();
    }
  }, [token, isBulkAssignModalOpen, branches.length]);

  // Lazy load destinations only when Edit modal is opened
  useEffect(() => {
    if (token && isEditModalOpen && destinations.length === 0) {
      fetchDestinations();
    }
  }, [token, isEditModalOpen, destinations.length]);

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
      const res = await api.put(`/crm/leads/${editingLead.id}`, {
        name: editingLead.name,
        phone: editingLead.phone,
        email: editingLead.email,
        travelDate: editingLead.travelDate || null,
        pax: editingLead.pax || null,
        numDays: editingLead.numDays || null,
        destination: editingLead.destination
      });
      const data = res.data;
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

  // Filter leads based on applied filters
  const filteredLeads = leads.filter(lead => {
    // Show 'NEW' and 'ASSIGNED' status leads
    if (lead.status !== 'NEW' && lead.status !== 'ASSIGNED') return false;

    // 2. Applied Filters logic
    if (appliedFilters.leadType && lead.leadCategory && lead.leadCategory.toLowerCase() !== appliedFilters.leadType.toLowerCase()) return false;
    if (appliedFilters.leadStage && lead.status !== appliedFilters.leadStage) return false;
    if (appliedFilters.leadSource && lead.source && lead.source.toLowerCase() !== appliedFilters.leadSource.toLowerCase()) return false;
    if (appliedFilters.customerName && !lead.name?.toLowerCase().includes(appliedFilters.customerName.toLowerCase())) return false;
    if (appliedFilters.customerMobile && !lead.phone?.includes(appliedFilters.customerMobile)) return false;
    if (appliedFilters.customerEmail && !lead.email?.toLowerCase().includes(appliedFilters.customerEmail.toLowerCase())) return false;
    if (appliedFilters.destination && !lead.destination?.toLowerCase().includes(appliedFilters.destination.toLowerCase())) return false;
    if (appliedFilters.branch && lead.branchId !== parseInt(appliedFilters.branch)) return false;
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

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, endIndex);

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
    setStrategy("ROUND_ROBIN");
    setSelectedExecutives([]);
    setExecutivePriorities({});
    setIsBulkAssignModalOpen(true);
  };

  const handleBulkAssignSubmit = async () => {
    if (assignMode === "EXECUTIVE" && !bulkAssignTarget) return alert("Please select an executive.");
    if (assignMode === "BRANCH" && !bulkAssignBranch) return alert("Please select a branch.");
    if (assignMode === "STRATEGIC" && selectedExecutives.length === 0) return alert("Please select at least one executive.");
    
    setIsBulkAssigning(true);
    try {
      const payload = {
        leadIds: selectedLeads,
        assignMode,
      };

      if (assignMode === "SELF") {
        payload.assignedToId = user?.id?.toString();
        payload.branchId = user?.branchId?.toString() || null;
      } else if (assignMode === "BRANCH") {
        payload.branchId = bulkAssignBranch;
      } else if (assignMode === "EXECUTIVE") {
        payload.assignedToId = bulkAssignTarget;
        payload.branchId = bulkAssignBranch || null;
      } else if (assignMode === "STRATEGIC") {
        payload.branchId = bulkAssignBranch || null;
        payload.strategy = strategy;
        payload.executiveIds = selectedExecutives;
        payload.priorities = executivePriorities;
      }

      const response = await api.put('/crm/leads/bulk-assign', payload);
      const data = response.data;
      if (data.success) {
        handleCloseBulkAssignModal();
        setBulkAssignTarget("");
        setBulkAssignBranch("");
        setBulkAssignSearch("");
        setSelectedExecutives([]);
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
      <div className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-300 ${isFilterExpanded ? '' : 'overflow-hidden'}`}>
        <div 
          className={`px-5 py-3.5 cursor-pointer flex justify-between items-center transition-colors ${isFilterExpanded ? 'bg-blue-50/50 border-b border-slate-100' : 'hover:bg-slate-50'}`}
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div className="flex items-center gap-2.5 text-blue-800 font-bold text-sm tracking-wide">
            <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
              <Filter size={14} strokeWidth={2.5} />
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
                  { value: 'PROPOSAL_SENT', label: 'Quotation Sent' },
                  { value: 'NEGOTIATION', label: 'Negotiation' },
                  { value: 'BOOKING_CONFIRMED', label: 'Booking Confirmed' },
                  { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
                  { value: 'LOST', label: 'Lost Leads' },
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
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>

              {/* Row 2 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Mobile</label>
                <input 
                  type="text" placeholder="Search by mobile..." value={filters.customerMobile} onChange={e => setFilters({...filters, customerMobile: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Email</label>
                <input 
                  type="text" placeholder="Search by email..." value={filters.customerEmail} onChange={e => setFilters({...filters, customerEmail: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Source/Destination</label>
                <input 
                  type="text" placeholder="E.g. Sikkim, Dubai" value={filters.destination} onChange={e => setFilters({...filters, destination: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <CustomSelect
                label="Branch"
                placeholder="All Branches"
                value={filters.branch}
                onChange={(val) => setFilters({...filters, branch: val, assignedTo: ''})}
                options={branches.map(b => ({ value: b.id, label: b.name }))}
              />
              <CustomSelect 
                label="Assigned To"
                placeholder="Any Owner"
                value={filters.assignedTo}
                onChange={(val) => setFilters({...filters, assignedTo: val})}
                options={(filters.branch ? users.filter(u => String(u.branchId) === String(filters.branch)) : users).map(u => ({ value: u.id, label: u.name }))}
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

      {/* Table Header Row */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Leads List</h4>
          {user?.role !== 'SALES_EXECUTIVE' && (
            <button 
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedLeads([]); // clear selection when canceling
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-2 ${
                isSelectionMode 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {isSelectionMode ? 'Cancel Selection' : 'Select Leads'}
            </button>
          )}
        </div>
        <div className="font-semibold text-slate-700 text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-250">
          Total Leads: {filteredLeads.length}
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
      <div className="bg-white rounded-2xl border border-slate-200 relative mb-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-700 font-medium text-[12px] bg-slate-50/50">
              <th className="px-3.5 py-2 w-12 text-center font-normal border-r border-slate-200">
                <input 
                  type="checkbox" 
                  checked={filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length}
                  onChange={handleSelectAll}
                  className="w-3.5 h-3.5 rounded-md border-slate-300 text-slate-800 cursor-pointer transition-all focus:ring-0" 
                />
              </th>
              <th className="px-3.5 py-2 font-normal whitespace-nowrap border-r border-slate-200">Created Date</th>
              <th className="px-3.5 py-2 min-w-[200px] font-normal border-r border-slate-200">Customer Details</th>
              <th className="px-3.5 py-2 font-normal border-r border-slate-200">Requirement</th>
              <th className="px-3.5 py-2 font-normal text-center border-r border-slate-200">Status</th>
              <th className="px-3.5 py-2 min-w-[150px] font-normal border-r border-slate-200">Remarks</th>
              <th className="px-3.5 py-2 font-normal text-center border-r border-slate-200">Follow Up</th>
              <th className="px-3.5 py-2 font-normal text-center border-r border-slate-200">Owner</th>
              <th className="px-3.5 py-2 text-center font-normal w-28">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {isLoading ? (
              <tr>
                <td colSpan="9" className="p-10 text-center text-slate-700 font-medium text-sm">
                   <div className="animate-spin w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full mx-auto mb-4"></div>
                   Loading leads...
                </td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-12 text-center text-slate-700 font-medium">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-slate-800 border border-slate-100">
                     <Search size={32} />
                  </div>
                  <div className="text-slate-800 font-bold text-lg mb-2">No leads found</div>
                  <div className="text-slate-700 text-sm">Try adjusting your filters or search terms.</div>
                </td>
              </tr>
            ) : (
              currentLeads.map((lead, index) => {
                const dateObj = new Date(lead.createdAt);
                const fullDayStr = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
                const dateMonthStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                const yearStr = dateObj.toLocaleDateString('en-GB', { year: 'numeric' });
                
                const getStatusStyle = (status) => {
                  switch(status) {
                    case 'NEW': return { color: 'text-emerald-600', bg: 'bg-emerald-500' };
                    case 'ASSIGNED': return { color: 'text-blue-600', bg: 'bg-blue-500' };
                    case 'LOST': return { color: 'text-red-600', bg: 'bg-red-500' };
                    case 'WON': return { color: 'text-indigo-600', bg: 'bg-indigo-500' };
                    case 'IN_PROGRESS': return { color: 'text-amber-600', bg: 'bg-amber-500' };
                    case 'PROPOSAL_SENT': return { color: 'text-purple-600', bg: 'bg-purple-500' };
                    case 'NEGOTIATION': return { color: 'text-pink-600', bg: 'bg-pink-500' };
                    case 'BOOKING_CONFIRMED': return { color: 'text-indigo-600', bg: 'bg-indigo-500' };
                    case 'PAYMENT_RECEIVED': return { color: 'text-teal-600', bg: 'bg-teal-500' };
                    default: return { color: 'text-slate-800', bg: 'bg-slate-500' };
                  }
                };
                
                const getStatusLabel = (status) => {
                  switch(status) {
                    case 'NEW': return 'New Lead';
                    case 'ASSIGNED': return 'Assigned';
                    case 'IN_PROGRESS': return 'In Progress';
                    case 'PROPOSAL_SENT': return 'Quotation Sent';
                    case 'NEGOTIATION': return 'Negotiation';
                    case 'BOOKING_CONFIRMED': return 'Booking Confirmed';
                    case 'PAYMENT_RECEIVED': return 'Payment Received';
                    case 'WON': return 'Payment Received';
                    case 'LOST': return 'Lost Leads';
                    default: return status.replace('_', ' ');
                  }
                };
                
                const statusStyle = getStatusStyle(lead.status);
                const statusLabel = getStatusLabel(lead.status);
                
                const isLast = index === currentLeads.length - 1;

                return (
                 <tr 
                   key={lead.id} 
                   onClick={() => {
                     if (isSelectionMode) {
                       handleSelectLead(lead.id);
                     } else {
                       navigate(`/crm/queries/${lead.id}`, { state: { lead } });
                     }
                   }}
                   className={`align-middle border-b border-slate-100 transition-colors cursor-pointer hover:bg-slate-50/80 ${selectedLeads.includes(lead.id) ? 'bg-slate-50/80' : ''} ${isLast ? 'border-b-0' : ''}`}
                 >
                  <td className="px-3.5 py-2 text-center align-middle border-r border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => handleSelectLead(lead.id)}
                      className="w-3.5 h-3.5 rounded-md border-slate-300 text-slate-800 cursor-pointer focus:ring-0 transition-all" 
                    />
                  </td>
                  <td className="px-3.5 py-2 text-[12px] text-slate-800 font-medium whitespace-nowrap align-middle border-r border-slate-100">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800 capitalize">{fullDayStr}</span>
                      <span className="text-[11px] text-slate-700 font-medium">{dateMonthStr}</span>
                      <span className="text-[10px] text-slate-500">{yearStr}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2 align-middle border-r border-slate-100">
                    <div className="flex flex-col justify-center h-full">
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-2 mb-0.5">
                        <span 
                          className={!isSelectionMode ? "cursor-pointer hover:text-blue-600 hover:underline" : ""}
                        >
                          {lead.name}
                        </span>
                        {lead.isDuplicate && <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Dup</span>}
                      </div>
                      <div className="flex flex-col">
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="text-slate-700 text-[10.5px] font-medium">{lead.phone}</div>
                            <button onClick={(e) => { e.stopPropagation(); handleEditClick(lead); }} className="text-slate-400 hover:text-blue-500 transition-all p-0.5"><Edit2 size={9} /></button>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="text-slate-800 text-[10px] truncate max-w-[200px]">{lead.email}</div>
                            <button onClick={(e) => { e.stopPropagation(); handleEditClick(lead); }} className="text-slate-400 hover:text-blue-500 transition-all p-0.5"><Edit2 size={9} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-2 text-xs text-slate-700 align-middle border-r border-slate-100">
                    <div 
                      className={`flex flex-col justify-center h-full p-1.5 -mx-1.5 rounded-lg transition-colors ${!isSelectionMode ? 'cursor-pointer group hover:bg-slate-50' : ''}`}
                      title={!isSelectionMode ? "Click to view full requirements" : ""}
                    >
                      <div className={`font-bold text-slate-800 transition-colors text-xs ${!isSelectionMode ? 'group-hover:text-blue-600' : ''}`}>{lead.destination || 'Not Specified'}</div>
                      {!isSelectionMode && (
                        <div className="text-slate-850 text-[9.5px] mt-0.5 font-medium flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                          Click to view details
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3.5 py-2 align-middle text-center border-r border-slate-100">
                    <div className="flex items-center justify-center gap-1 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm w-fit mx-auto">
                      <span className={`w-1 h-1 rounded-full ${statusStyle.bg}`}></span>
                      <span className={`text-[9.5px] font-bold ${statusStyle.color} tracking-wide uppercase`}>
                        {statusLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2 align-middle border-r border-slate-100">
                    <div 
                      className="text-slate-700 text-[11px] truncate max-w-[150px] hover:text-blue-600 transition-colors group" 
                      title={lead.notes && lead.notes.length > 0 ? lead.notes[lead.notes.length - 1].content : ''}
                    >
                      {lead.notes && lead.notes.length > 0 
                        ? lead.notes[lead.notes.length - 1].content 
                        : <span className="italic text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded">No remarks</span>
                      }
                    </div>
                  </td>
                  <td className="px-3.5 py-2 align-middle text-center border-r border-slate-100">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleFollowUpClick(lead); setOpenDropdownId(null); }}
                      className="group flex flex-col items-center justify-center w-full h-full py-1 cursor-pointer"
                      title="Click to add/update follow-up"
                    >
                      {lead.nextFollowUp ? (
                        <div className="flex flex-col items-center">
                          <div className="text-[10.5px] font-bold text-blue-600 whitespace-nowrap">
                            {new Date(lead.nextFollowUp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-[9px] text-blue-400 font-medium mt-0.5 flex items-center gap-0.5 group-hover:text-blue-600 transition-colors">
                            <Clock size={9} /> Update
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm transition-all hover:shadow-md">
                          <Clock size={10} />
                          Follow Up
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="px-3.5 py-2 align-middle border-r border-slate-100">
                    <div className="flex items-center justify-start gap-2">
                       <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-[10px] shadow-sm ring-2 ring-white flex-shrink-0">
                         {(lead.assignedTo?.name || 'U').charAt(0).toUpperCase()}
                       </div>
                       <div className="text-slate-800 font-medium text-xs truncate max-w-[120px]">
                         {lead.assignedTo?.name || 'Unassigned'}
                       </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2 w-full">
                      <div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openDropdownId === lead.id) {
                              setOpenDropdownId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const menuHeight = 220;
                              const spaceBelow = window.innerHeight - rect.bottom;
                              
                              if (spaceBelow < menuHeight) {
                                setDropdownCoords({
                                  top: Math.round(rect.top - menuHeight - 8),
                                  left: Math.round(rect.right - 192)
                                });
                              } else {
                                setDropdownCoords({
                                  top: Math.round(rect.bottom + 8),
                                  left: Math.round(rect.right - 192)
                                });
                              }
                              setOpenDropdownId(lead.id);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center text-slate-800 hover:text-slate-700 border border-slate-200 rounded-full bg-white hover:bg-slate-50 transition-colors shadow-sm focus:outline-none" 
                        >
                          <MoreVertical size={14} />
                        </button>
  
                        {openDropdownId === lead.id && createPortal(
                          <div 
                            className="fixed w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-[9999] py-2 animate-in fade-in zoom-in-95 duration-200 text-left"
                            style={{ top: dropdownCoords.top, left: dropdownCoords.left }}
                          >
                            <button onClick={(e) => { e.stopPropagation(); handleFollowUpClick(lead); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"><Clock size={14} className="text-blue-500" /> Follow Up</button>
                            <button onClick={(e) => { e.stopPropagation(); handleEditClick(lead); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"><Edit2 size={14} className="text-emerald-500" /> Edit Details</button>
                            <button onClick={(e) => { e.stopPropagation(); handleOpenQuotation(lead); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"><FileText size={14} className="text-amber-500" /> Send Quotation</button>
                            <div className="h-px bg-slate-100 my-1 mx-3"></div>
                            <button onClick={(e) => { e.stopPropagation(); setActiveViewLead(lead); setIsViewDetailsOpen(true); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"><Eye size={14} className="text-indigo-500" /> View Full Profile</button>
                            <button onClick={(e) => { e.stopPropagation(); setActiveCommentsLead(lead); setIsCommentsOpen(true); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"><MessageSquare size={14} className="text-purple-500" /> Internal Notes</button>
                            <div className="h-px bg-slate-100 my-1 mx-3"></div>
                            <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleDeleteLead(lead.id); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">Delete Query</button>
                          </div>,
                          document.body
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination Controls */}
        {filteredLeads.length > itemsPerPage && (
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
                  <span className="font-semibold text-slate-800">{Math.min(endIndex, filteredLeads.length)}</span> of{' '}
                  <span className="font-semibold text-slate-800">{filteredLeads.length}</span> results
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

      {/* Edit Lead Modal */}
      {isEditModalOpen && createPortal(
        <div className={`fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm ${isClosingEdit ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto ${isClosingEdit ? 'animate-slide-out-left' : 'animate-slide-in-left'}`}>
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800">Complete Lead Details</h3>
              <button onClick={handleCloseEditModal} className="text-slate-800 hover:text-red-500 hover:bg-red-50 rounded-md p-1 transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleUpdateLead} className="p-5 space-y-3.5">
              
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Customer Name</label>
                <input 
                  type="text" 
                  value={editingLead?.name || ''}
                  onChange={(e) => setEditingLead({...editingLead, name: e.target.value})}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Phone Number</label>
                  <input 
                    type="text" 
                    value={editingLead?.phone || ''}
                    onChange={(e) => setEditingLead({...editingLead, phone: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Email Address</label>
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
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Destination</label>
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
                  <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Travel Date</label>
                  <input 
                    type="date" 
                    value={editingLead?.travelDate || ''}
                    onChange={(e) => setEditingLead({...editingLead, travelDate: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Pax</label>
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
                    <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">Days</label>
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

      {/* Detailed Follow Up Modal */}
      <FollowUpModal 
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        lead={activeFollowUpLead}
        user={user}
        token={token}
        onFollowUpSaved={fetchLeads}
      />

      <SendQuotationModal 
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        query={selectedQuotationLead}
        onStatusUpdate={fetchLeads}
      />

      {/* Bulk Assign Modal */}
      {isBulkAssignModalOpen && createPortal(
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm ${isClosingBulk ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`bg-white rounded-2xl shadow-2xl w-full ${assignMode === 'STRATEGIC' ? 'max-w-5xl' : 'max-w-xl'} overflow-visible ${isClosingBulk ? 'animate-slide-out-left' : 'animate-slide-in-left'} border border-slate-100 flex flex-col max-h-[90vh] transition-all duration-300`}>
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-lg">Bulk Assign Leads</h3>
              <button onClick={handleCloseBulkAssignModal} className="text-slate-800 hover:text-slate-700 p-1.5 hover:bg-slate-200 rounded-full transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 overflow-visible min-h-0 flex-1 flex flex-col">
              <div className="mb-6 text-base text-slate-800">
                You are about to assign <strong className="text-blue-600 text-lg">{selectedLeads.length}</strong> selected lead{selectedLeads.length > 1 ? 's' : ''} to a new owner.
              </div>
              
              {assignMode === 'STRATEGIC' && strategy === 'PRIORITY_WEIGHTED' && (
                <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs leading-relaxed text-left">
                  <strong>Priority is used only for this assignment (not saved).</strong> Select team members, then set priority 1-99 — higher numbers receive more leads. Default is 1 if unset.
                </div>
              )}
              
              {/* Assignment Mode Selection */}
              {assignMode !== 'STRATEGIC' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {user?.role !== 'BRANCH_MANAGER' && (
                    <>
                      <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${assignMode === 'SELF' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}>
                        <input 
                          type="radio" 
                          name="assignMode" 
                          checked={assignMode === 'SELF'} 
                          onChange={() => {
                            setAssignMode('SELF');
                            setBulkAssignTarget("");
                            setSelectedExecutives([]);
                          }}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-slate-800 text-sm">Assign to Me</div>
                          <div className="text-xs text-slate-700 mt-0.5">Quickly assign to yourself</div>
                        </div>
                      </label>

                      <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${assignMode === 'BRANCH' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}>
                        <input 
                          type="radio" 
                          name="assignMode" 
                          checked={assignMode === 'BRANCH'} 
                          onChange={() => {
                            setAssignMode('BRANCH');
                            setBulkAssignTarget("");
                            setSelectedExecutives([]);
                          }}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-slate-800 text-sm">Assign to Branch</div>
                          <div className="text-xs text-slate-700 mt-0.5">Move to branch pool</div>
                        </div>
                      </label>
                    </>
                  )}
                  
                  <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${assignMode === 'EXECUTIVE' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}>
                    <input 
                      type="radio" 
                      name="assignMode" 
                      checked={assignMode === 'EXECUTIVE'} 
                      onChange={() => {
                        setAssignMode('EXECUTIVE');
                        setBulkAssignTarget("");
                        setSelectedExecutives([]);
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Direct Assign</div>
                      <div className="text-xs text-slate-700 mt-0.5">Assign to specific person</div>
                    </div>
                  </label>

                  <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${assignMode === 'STRATEGIC' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}>
                    <input 
                      type="radio" 
                      name="assignMode" 
                      checked={assignMode === 'STRATEGIC'} 
                      onChange={() => {
                        setAssignMode('STRATEGIC');
                        setBulkAssignTarget("");
                        setSelectedExecutives([]);
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Strategic Assign</div>
                      <div className="text-xs text-slate-700 mt-0.5">Distribute leads using rules</div>
                    </div>
                  </label>
                </div>
              )}

              {/* Branch and Search Filters */}
              {assignMode !== 'SELF' && assignMode !== 'STRATEGIC' && (
                <div className={`grid ${assignMode !== 'BRANCH' && user?.role !== 'BRANCH_MANAGER' ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-4`}>
                  {user?.role !== 'BRANCH_MANAGER' && (
                    <CustomSelect 
                      label="Select Branch"
                      placeholder="Choose a branch..."
                      value={bulkAssignBranch}
                      onChange={(val) => {
                        setBulkAssignBranch(val);
                        setBulkAssignTarget("");
                        setSelectedExecutives([]);
                      }}
                      options={branches.map(b => ({ value: b.id.toString(), label: b.name }))}
                    />
                  )}
                  
                  {assignMode !== 'BRANCH' && (
                    <div className="relative flex flex-col justify-end">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Search Executive
                      </label>
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-800" />
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
              )}

              {/* Direct Assign List */}
              {assignMode === 'EXECUTIVE' && (
                bulkAssignBranch ? (
                  <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="overflow-y-auto bg-white flex-1 min-h-0">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="uppercase tracking-wider border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 w-12 text-center">Select</th>
                            <th className="px-4 py-3">Executive Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {/* Self Assignment Row */}
                          <tr 
                            className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${bulkAssignTarget === user?.id?.toString() ? 'bg-blue-50' : ''}`}
                            onClick={() => setBulkAssignTarget(user?.id?.toString())}
                          >
                            <td className="px-4 py-3 text-center border-b-2 border-blue-100">
                              <input 
                                type="radio" 
                                name="bulkAssignUser"
                                checked={bulkAssignTarget === user?.id?.toString()} 
                                onChange={() => setBulkAssignTarget(user?.id?.toString())}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 font-bold text-blue-700 border-b-2 border-blue-100">
                              Self (Assign to me)
                            </td>
                            <td className="px-4 py-3 text-slate-700 border-b-2 border-blue-100">
                              {user?.email}
                            </td>
                            <td className="px-4 py-3 text-slate-700 border-b-2 border-blue-100">
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                {user?.role?.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>

                          {/* Branch Executives */}
                          {users
                            .filter(u => u.branchId?.toString() === bulkAssignBranch && u.id !== user?.id)
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
                              <td className="px-4 py-3 text-slate-700">
                                {u.email}
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {u.role.replace('_', ' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {users.filter(u => u.branchId?.toString() === bulkAssignBranch).length === 0 && (
                            <tr>
                              <td colSpan="4" className="px-4 py-8 text-center text-slate-700">
                                No sales executives found for this branch.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 border border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-700 bg-slate-50/50 flex-1">
                    <Briefcase size={32} className="mb-3 text-slate-800" />
                    <p className="text-sm font-medium">Select a branch to view executives</p>
                  </div>
                )
              )}

              {/* Strategic Assignment Layout */}
              {assignMode === 'STRATEGIC' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 h-[350px]">
                  {/* Column 1: Strategy */}
                  <div className="border border-slate-200 rounded-xl p-3 flex flex-col gap-2.5 text-left bg-white overflow-y-auto max-h-full">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                      <Briefcase size={14} className="text-blue-600" /> STRATEGY
                    </label>
                    
                    <div 
                      onClick={() => setStrategy('ROUND_ROBIN')}
                      className={`p-2.5 border rounded-xl cursor-pointer transition-all ${strategy === 'ROUND_ROBIN' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}
                    >
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          checked={strategy === 'ROUND_ROBIN'} 
                          onChange={() => setStrategy('ROUND_ROBIN')}
                          className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-bold text-slate-800 text-xs">Round Robin</span>
                      </div>
                      <p className="text-[10px] text-slate-700 mt-1 leading-relaxed">
                        Leads rotate equally in sequence across the team.
                      </p>
                    </div>

                    <div 
                      onClick={() => setStrategy('LEAST_LOADED')}
                      className={`p-2.5 border rounded-xl cursor-pointer transition-all ${strategy === 'LEAST_LOADED' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}
                    >
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          checked={strategy === 'LEAST_LOADED'} 
                          onChange={() => setStrategy('LEAST_LOADED')}
                          className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-bold text-slate-800 text-xs">Least Loaded</span>
                      </div>
                      <p className="text-[10px] text-slate-700 mt-1 leading-relaxed">
                        Leads go to agents with the fewest active leads.
                      </p>
                    </div>

                    <div 
                      onClick={() => setStrategy('PRIORITY_WEIGHTED')}
                      className={`p-2.5 border rounded-xl cursor-pointer transition-all ${strategy === 'PRIORITY_WEIGHTED' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}
                    >
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          checked={strategy === 'PRIORITY_WEIGHTED'} 
                          onChange={() => setStrategy('PRIORITY_WEIGHTED')}
                          className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-bold text-slate-800 text-xs">Priority Weighted</span>
                      </div>
                      <p className="text-[10px] text-slate-700 mt-1 leading-relaxed">
                        Leads are distributed by seniority or user weights.
                      </p>
                    </div>

                    <div 
                      onClick={() => setStrategy('PERFORMANCE_BASED')}
                      className={`p-2.5 border rounded-xl cursor-pointer transition-all ${strategy === 'PERFORMANCE_BASED' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}
                    >
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          checked={strategy === 'PERFORMANCE_BASED'} 
                          onChange={() => setStrategy('PERFORMANCE_BASED')}
                          className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-bold text-slate-800 text-xs">Performance Based</span>
                      </div>
                      <p className="text-[10px] text-slate-700 mt-1 leading-relaxed">
                        Higher converting executives receive more leads.
                      </p>
                    </div>
                  </div>

                  {/* Column 2: Branches */}
                  <div className="border border-slate-200 rounded-xl flex flex-col overflow-hidden bg-white text-left">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-1.5">
                      <MapPin size={14} className="text-blue-600" />
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Select Branch</span>
                    </div>
                    <div className="overflow-y-auto flex-1 p-3 space-y-2">
                      {branches.map(b => {
                        const isSelected = bulkAssignBranch === b.id.toString();
                        return (
                          <label 
                            key={b.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${isSelected ? 'border-blue-400 bg-blue-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                          >
                            <input 
                              type="radio"
                              name="strategicBranch"
                              checked={isSelected}
                              onChange={() => {
                                setBulkAssignBranch(b.id.toString());
                                setBulkAssignTarget("");
                                setSelectedExecutives([]);
                              }}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-800 truncate">{b.name}</div>
                              <div className="text-[11px] text-slate-700 truncate">{b.city}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 3: Sales Executives */}
                  <div className="border border-slate-200 rounded-xl flex flex-col overflow-hidden bg-white text-left">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-blue-600" />
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Sales Executives</span>
                      </div>
                      {bulkAssignBranch && (
                        <button 
                          onClick={() => {
                            const branchUsers = users.filter(u => u.branchId?.toString() === bulkAssignBranch && u.id !== user?.id);
                            if (selectedExecutives.length === branchUsers.length) {
                              setSelectedExecutives([]);
                            } else {
                              setSelectedExecutives(branchUsers.map(u => u.id));
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          {selectedExecutives.length === users.filter(u => u.branchId?.toString() === bulkAssignBranch && u.id !== user?.id).length ? 'Clear' : 'All'}
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1 p-3 space-y-2">
                      {bulkAssignBranch ? (
                        <>
                          {users
                            .filter(u => u.branchId?.toString() === bulkAssignBranch && u.id !== user?.id)
                            .filter(u => {
                              if (!bulkAssignSearch) return true;
                              const s = bulkAssignSearch.toLowerCase();
                              return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
                            })
                            .map(u => {
                              const isChecked = selectedExecutives.includes(u.id);
                              return (
                                <div 
                                  key={u.id}
                                  className={`flex flex-col gap-2 p-2.5 border rounded-lg transition-all ${isChecked ? 'border-blue-400 bg-blue-50/20' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                  <label 
                                    className="flex items-center gap-3 cursor-pointer"
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setSelectedExecutives(selectedExecutives.filter(id => id !== u.id));
                                          const newPriorities = { ...executivePriorities };
                                          delete newPriorities[u.id];
                                          setExecutivePriorities(newPriorities);
                                        } else {
                                          setSelectedExecutives([...selectedExecutives, u.id]);
                                          setExecutivePriorities({ ...executivePriorities, [u.id]: 1 });
                                        }
                                      }}
                                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-semibold text-slate-800 truncate">{u.name}</div>
                                      <div className="text-[10px] text-slate-700 truncate">{u.email}</div>
                                    </div>
                                  </label>

                                  {isChecked && strategy === 'PRIORITY_WEIGHTED' && (
                                    <div className="flex items-center gap-2 pl-7 animate-in slide-in-from-top-1 duration-150">
                                      <input 
                                        type="number"
                                        min="1"
                                        max="99"
                                        value={executivePriorities[u.id] || 1}
                                        onChange={(e) => {
                                          const val = Math.max(1, Math.min(99, parseInt(e.target.value) || 1));
                                          setExecutivePriorities({ ...executivePriorities, [u.id]: val });
                                        }}
                                        className="w-16 px-1.5 py-0.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-500 text-center"
                                        placeholder="1-99"
                                      />
                                      <span className="text-[10px] text-slate-700 font-medium">Priority</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          {users.filter(u => u.branchId?.toString() === bulkAssignBranch && u.id !== user?.id).length === 0 && (
                            <div className="text-center text-slate-700 text-xs py-8">
                              No sales executives found.
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-700 h-full py-8 text-center">
                          <Briefcase size={28} className="mb-2 text-slate-800" />
                          <p className="text-xs font-medium">Select a branch first</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/80 shrink-0 rounded-b-2xl">
              {assignMode === 'STRATEGIC' && (
                <button 
                  onClick={() => {
                    if (user?.role === 'BRANCH_MANAGER') {
                      setAssignMode('EXECUTIVE');
                    } else {
                      setAssignMode('BRANCH');
                    }
                    setBulkAssignBranch("");
                    setSelectedExecutives([]);
                  }} 
                  className="px-5 py-2 text-sm text-slate-700 font-bold hover:bg-slate-100 border border-slate-200 bg-white rounded-lg transition-colors mr-auto"
                >
                  Back
                </button>
              )}
              <button onClick={handleCloseBulkAssignModal} className="px-5 py-2 text-sm text-slate-800 font-bold hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleBulkAssignSubmit} 
                disabled={
                  isBulkAssigning || 
                  (assignMode === 'BRANCH' && !bulkAssignBranch) || 
                  (assignMode === 'EXECUTIVE' && (!bulkAssignBranch || !bulkAssignTarget)) ||
                  (assignMode === 'STRATEGIC' && (!bulkAssignBranch || selectedExecutives.length === 0))
                }
                className={`px-5 py-2 text-white text-sm font-bold rounded-lg transition-colors shadow-md ${
                  isBulkAssigning || 
                  (assignMode === 'BRANCH' && !bulkAssignBranch) || 
                  (assignMode === 'EXECUTIVE' && (!bulkAssignBranch || !bulkAssignTarget)) ||
                  (assignMode === 'STRATEGIC' && (!bulkAssignBranch || selectedExecutives.length === 0))
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                }`}
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
              <button onClick={handleCloseViewDetails} className="text-slate-800 hover:text-slate-700 p-1.5 hover:bg-slate-200 rounded-full transition-colors">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] text-slate-700 uppercase font-bold">Name</label><div className="text-sm text-slate-800">{activeViewLead.name}</div></div>
                <div><label className="text-[10px] text-slate-700 uppercase font-bold">Phone</label><div className="text-sm text-slate-800">{activeViewLead.phone}</div></div>
                <div><label className="text-[10px] text-slate-700 uppercase font-bold">Email</label><div className="text-sm text-slate-800">{activeViewLead.email || 'N/A'}</div></div>
                <div><label className="text-[10px] text-slate-700 uppercase font-bold">Destination</label><div className="text-sm text-slate-800">{activeViewLead.destination || 'N/A'}</div></div>
                <div><label className="text-[10px] text-slate-700 uppercase font-bold">Travel Date</label><div className="text-sm text-slate-800">{activeViewLead.travelDate ? new Date(activeViewLead.travelDate).toLocaleDateString('en-GB') : 'N/A'}</div></div>
                <div><label className="text-[10px] text-slate-700 uppercase font-bold">Pax</label><div className="text-sm text-slate-800">{activeViewLead.pax || 'N/A'}</div></div>
                <div><label className="text-[10px] text-slate-700 uppercase font-bold">Status</label><div className="text-sm text-slate-800">{activeViewLead.status}</div></div>
                <div><label className="text-[10px] text-slate-700 uppercase font-bold">Source</label><div className="text-sm text-slate-800">{activeViewLead.source}</div></div>
                {activeViewLead.notes && activeViewLead.notes.length > 0 && (
                  <div className="col-span-2 mt-2">
                    <label className="text-[10px] text-slate-700 uppercase font-bold">Latest Note</label>
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
              <button onClick={handleCloseComments} className="text-slate-800 hover:text-slate-700 p-1.5 hover:bg-slate-200 rounded-full transition-colors">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50">
              {(!activeCommentsLead.notes || activeCommentsLead.notes.length === 0) ? (
                <div className="text-center text-slate-700 text-sm py-4">No comments yet.</div>
              ) : (
                <div className="space-y-3">
                  {activeCommentsLead.notes.map((note, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      <div className="text-xs text-slate-700 mb-1 font-medium">{new Date(note.createdAt).toLocaleString('en-GB')}</div>
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
      {/* Requirement Details Modal */}
      {isRequirementOpen && activeRequirementLead && createPortal(
        <div className={`fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm ${isClosingRequirement ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ${isClosingRequirement ? 'animate-slide-out-down' : 'animate-slide-in-up'}`}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Map size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Travel Requirements</h3>
                  <p className="text-xs text-slate-700 font-medium">{activeRequirementLead.name}</p>
                </div>
              </div>
              <button onClick={handleCloseRequirement} className="text-slate-800 hover:text-red-500 hover:bg-red-50 rounded-md p-1.5 transition-colors focus:outline-none">
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-800 tracking-wider mb-1">Destination</div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <MapPin size={14} className="text-emerald-500" />
                    {activeRequirementLead.destination || 'Not Specified'}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-800 tracking-wider mb-1">Travel Date</div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500" />
                    {activeRequirementLead.travelDate ? new Date(activeRequirementLead.travelDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Flexible'}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-800 tracking-wider mb-1">Duration</div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Clock size={14} className="text-amber-500" />
                    {activeRequirementLead.numDays ? `${activeRequirementLead.numDays} Days` : 'TBD'}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-800 tracking-wider mb-1">Travelers</div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <User size={14} className="text-purple-500" />
                    {activeRequirementLead.pax ? `${activeRequirementLead.pax} Pax` : 'TBD'}
                  </div>
                </div>
              </div>

              {activeRequirementLead.notes && activeRequirementLead.notes.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <MessageSquare size={14} className="text-slate-800" />
                    Latest Remarks
                  </div>
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-sm text-slate-700 leading-relaxed italic">
                    "{activeRequirementLead.notes[activeRequirementLead.notes.length - 1].content}"
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleCloseRequirement}
                className="px-5 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Source Details Modal */}
      {isSourceOpen && activeSourceLead && createPortal(
        <div className={`fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm ${isClosingSource ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ${isClosingSource ? 'animate-slide-out-down' : 'animate-slide-in-up'}`}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Source Details</h3>
                  <p className="text-xs text-slate-700 font-medium">{activeSourceLead.name}</p>
                </div>
              </div>
              <button onClick={handleCloseSource} className="text-slate-800 hover:text-red-500 hover:bg-red-50 rounded-md p-1.5 transition-colors focus:outline-none">
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="text-[11px] uppercase font-bold text-slate-800 tracking-wider">Lead Source</div>
                <div className="font-bold text-slate-800 text-sm">{activeSourceLead.source || 'Website'}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="text-[11px] uppercase font-bold text-slate-800 tracking-wider">Lead Category</div>
                <div className="font-bold text-slate-800 text-sm">
                   <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs">{activeSourceLead.leadCategory || 'B2C'}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="text-[11px] uppercase font-bold text-slate-800 tracking-wider">Lead Type</div>
                <div className="font-bold text-slate-800 text-sm">
                   <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs">{activeSourceLead.type || 'LEAD'}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="text-[11px] uppercase font-bold text-slate-800 tracking-wider">Creation Date</div>
                <div className="font-bold text-slate-800 text-sm">
                  {new Date(activeSourceLead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleCloseSource}
                className="px-5 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Source Details Modal */}
      {isSourceOpen && activeSourceLead && createPortal(
        <div className={`fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm ${isClosingSource ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ${isClosingSource ? 'animate-slide-out-down' : 'animate-slide-in-up'}`}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Source Details</h3>
                  <p className="text-xs text-slate-700 font-medium">{activeSourceLead.name}</p>
                </div>
              </div>
              <button onClick={handleCloseSource} className="text-slate-800 hover:text-red-500 hover:bg-red-50 rounded-md p-1.5 transition-colors focus:outline-none">
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="text-[11px] uppercase font-bold text-slate-800 tracking-wider">Lead Source</div>
                <div className="font-bold text-slate-800 text-sm">{activeSourceLead.source || 'Website'}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="text-[11px] uppercase font-bold text-slate-800 tracking-wider">Lead Category</div>
                <div className="font-bold text-slate-800 text-sm">
                   <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs">{activeSourceLead.leadCategory || 'B2C'}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="text-[11px] uppercase font-bold text-slate-800 tracking-wider">Lead Type</div>
                <div className="font-bold text-slate-800 text-sm">
                   <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs">{activeSourceLead.type || 'LEAD'}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="text-[11px] uppercase font-bold text-slate-800 tracking-wider">Creation Date</div>
                <div className="font-bold text-slate-800 text-sm">
                  {new Date(activeSourceLead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleCloseSource}
                className="px-5 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>, document.body
      )}

    </div>
  );
};

export default LeadsList;
