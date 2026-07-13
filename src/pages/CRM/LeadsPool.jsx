import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, MessageSquare, Edit2, Search, FileText } from 'lucide-react';
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
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  // Follow Up Modal State
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [activeFollowUpLead, setActiveFollowUpLead] = useState(null);

  // Quotation Modal State
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [selectedQuotationLead, setSelectedQuotationLead] = useState(null);

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

  useEffect(() => {
    if (token) {
      fetchLeads();
      fetchDestinations();
      fetchUsers();
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
        setIsEditModalOpen(false);
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

  const handleBulkAssignSubmit = async () => {
    if (!bulkAssignTarget) return alert("Please select a user.");
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
          assignedToId: bulkAssignTarget
        })
      });
      const data = await response.json();
      if (data.success) {
        setIsBulkAssignModalOpen(false);
        setBulkAssignTarget("");
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
            onClick={() => setIsBulkAssignModalOpen(true)}
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
                      <button onClick={() => handleEditClick(lead)} className="text-slate-400 hover:text-blue-600 transition-colors ml-1"><Edit2 size={12} /></button>
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
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex gap-2">
                        <button className="text-slate-400 hover:text-blue-600 transition-colors" title="View"><Eye size={14} /></button>
                        <button className="text-slate-400 hover:text-blue-600 transition-colors" title="Comments/Chat"><MessageSquare size={14} /></button>
                      </div>
                      <button 
                        onClick={() => handleOpenQuotation(lead)}
                        className="text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[9px] font-medium" 
                        title="Send Quotation"
                      >
                        <FileText size={10} /> Quote
                      </button>
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
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-in-up">
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800">Complete Lead Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md p-1 transition-colors">&times;</button>
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
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-base">Bulk Assign Leads</h3>
              <button onClick={() => setIsBulkAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
                ✕
              </button>
            </div>
            <div className="p-5">
              <div className="mb-4 text-sm text-slate-600">
                You are about to assign <strong className="text-blue-600">{selectedLeads.length}</strong> selected lead(s) to a new owner.
              </div>
              <CustomSelect 
                label="Assign To"
                placeholder="Select Owner..."
                value={bulkAssignTarget}
                onChange={setBulkAssignTarget}
                options={users.map(u => ({ value: u.id, label: u.name }))}
              />
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50">
              <button onClick={() => setIsBulkAssignModalOpen(false)} className="px-4 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleBulkAssignSubmit} 
                disabled={isBulkAssigning || !bulkAssignTarget}
                className={`px-4 py-1.5 text-white text-xs font-bold rounded-lg transition-colors shadow-sm ${isBulkAssigning || !bulkAssignTarget ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isBulkAssigning ? 'Assigning...' : 'Assign Leads'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LeadsPool;
