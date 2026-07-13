import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, MoreVertical, Edit2, Key, UserX, Users, Shield, Briefcase, Building, Mail, X, Filter, ChevronDown, CheckCircle, Clock } from 'lucide-react';

// Mock Data for UI presentation until Backend is linked
const MOCK_USERS = [
  { id: 1, name: 'Rahul Sharma', email: 'rahul@prathamtours.com', role: 'SUPER_ADMIN', branch: 'Head Office (Mumbai)', status: 'ACTIVE', joined: 'Jan 2024' },
  { id: 2, name: 'Vikas Singh', email: 'vikas@prathamtours.com', role: 'BRANCH_MANAGER', branch: 'Delhi Branch', status: 'ACTIVE', joined: 'Mar 2024' },
  { id: 3, name: 'Neha Gupta', email: 'neha@prathamtours.com', role: 'SALES_EXECUTIVE', branch: 'Delhi Branch', status: 'ACTIVE', joined: 'Apr 2024' },
  { id: 4, name: 'Amit Kumar', email: 'amit@prathamtours.com', role: 'SALES_EXECUTIVE', branch: 'Head Office (Mumbai)', status: 'INACTIVE', joined: 'Feb 2024' },
];

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full access to everything' },
  { value: 'ADMIN', label: 'Admin', desc: 'Can manage most settings, except core branches' },
  { value: 'BRANCH_MANAGER', label: 'Branch Manager', desc: 'Can see all branch leads and manage team' },
  { value: 'SALES_EXECUTIVE', label: 'Sales Executive', desc: 'Can only see their assigned leads' },
];

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
    <div className="w-full">
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      <div className="relative" ref={dropdownRef}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full min-w-[140px] px-3 py-2 bg-white border ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-300'} rounded-md text-sm text-slate-900 font-medium cursor-pointer flex justify-between items-center shadow-sm transition-shadow`}
        >
          <span className={value && value !== 'ALL' ? 'text-slate-900' : 'text-slate-500'}>{selectedOption && value !== 'ALL' ? selectedOption.label : placeholder}</span>
          <div className={`text-slate-500 transition-transform duration-300 ml-2 ${isOpen ? '-rotate-180' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
            <div 
              className="px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
              onClick={() => { onChange("ALL"); setIsOpen(false); }}
            >
              {placeholder}
            </div>
            {options.map((opt) => (
              <div 
                key={opt.value}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${String(value) === String(opt.value) && value !== 'ALL' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'}`}
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

const TeamManager = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);

  const [branches, setBranches] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          branchId: u.branchId,
          branch: u.branch?.name || 'Unassigned',
          status: u.status || 'ACTIVE',
          joined: new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        })));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/branches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBranches(data.data);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchBranches();
    }
  }, [token]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortFilter, setSortFilter] = useState('NEWEST');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsModalOpen(false);
    }, 280);
  };
  const [editingUserId, setEditingUserId] = useState(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.style.overflow = '';
    };
  }, [isModalOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };
    if (openDropdownId !== null) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdownId]);
  
  // New User Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES_EXECUTIVE',
    branch: 'Head Office (Mumbai)'
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider">SUPER ADMIN</span>;
      case 'ADMIN': return <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider">ADMIN</span>;
      case 'BRANCH_MANAGER': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider">MANAGER</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider">SALES</span>;
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'ACTIVE') {
      return <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active</span>;
    }
    return <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Inactive</span>;
  };

  let filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesBranch = branchFilter === 'ALL' || u.branch === branchFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesBranch && matchesStatus;
  });

  if (sortFilter === 'NEWEST') {
    filteredUsers.sort((a, b) => b.id - a.id);
  } else if (sortFilter === 'OLDEST') {
    filteredUsers.sort((a, b) => a.id - b.id);
  }

  const uniqueBranches = ['ALL', ...new Set(users.map(u => u.branch))];

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setFormData({ name: '', email: '', password: '', role: 'SALES_EXECUTIVE', branchId: '' });
    setIsModalOpen(true);
  };

  const handleEditClick = (userToEdit) => {
    setIsEditing(true);
    setEditingUserId(userToEdit.id);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: '', // Don't show existing password
      role: userToEdit.role,
      branchId: userToEdit.branchId
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (userId) => {
    const userToToggle = users.find(u => u.id === userId);
    if (!userToToggle) return;
    try {
      const newStatus = userToToggle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await fetch(`http://127.0.0.1:5000/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          fetchUsers();
        } else {
          alert(data.message || 'Failed to delete user');
        }
      } catch (err) {
        console.error(err);
      }
    }
    setOpenDropdownId(null);
  };

  const handleResetPassword = async (email) => {
    // Ideally this could call a reset endpoint, but for now we'll allow manual reset in Edit form.
    alert(`Please use the Edit User option to set a new password for ${email}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      
      // Pass branchId. If user is MANAGER, the backend will auto-assign their branch anyway,
      // but if ADMIN, they can select it.
      if (formData.branchId) {
        payload.branchId = formData.branchId;
      }
      
      if (formData.password) {
        payload.password = formData.password;
      }

      let url = 'http://127.0.0.1:5000/api/register';
      let method = 'POST';

      if (isEditing) {
        url = `http://127.0.0.1:5000/api/users/${editingUserId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        handleCloseModal();
      } else {
        alert(data.message || 'Failed to save user');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving user');
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Team & Users</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your staff, assign roles, and control access to the CRM.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus size={18} /> Add Member
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-5 gap-y-4 items-end">
           <CustomSelect 
             label="Select Role"
             placeholder="All Roles"
             value={roleFilter}
             onChange={setRoleFilter}
             options={ROLES.map(r => ({ value: r.value, label: r.label }))}
           />
           
           <CustomSelect 
             label="Select Branch"
             placeholder="All Branches"
             value={branchFilter}
             onChange={setBranchFilter}
             options={uniqueBranches.filter(b => b !== 'ALL').map(b => ({ value: b, label: b }))}
           />
           
           <CustomSelect 
             label="Select Status"
             placeholder="All Status"
             value={statusFilter}
             onChange={setStatusFilter}
             options={[
               { value: 'ACTIVE', label: 'Active' },
               { value: 'INACTIVE', label: 'Inactive' }
             ]}
           />
           
           <CustomSelect 
             label="Sort By"
             placeholder="Sort Order"
             value={sortFilter}
             onChange={setSortFilter}
             options={[
               { value: 'NEWEST', label: 'Newest First' },
               { value: 'OLDEST', label: 'Oldest First' }
             ]}
           />

           <div>
             <label className="block text-xs font-bold text-slate-700 mb-1.5">Search Staff</label>
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Search by name or email..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
               />
             </div>
           </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">User Info</th>
                <th className="px-6 py-4">Role & Access</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users size={32} className="text-slate-300 mb-3" />
                      <p className="text-sm font-medium">No users found.</p>
                      <p className="text-xs text-slate-400">Try adjusting your search query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200">
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{u.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail size={10} /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                        <Building size={14} className="text-slate-400" />
                        {u.branch}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(u.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                      {u.joined}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === `row-${u.id}` ? null : `row-${u.id}`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" 
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openDropdownId === `row-${u.id}` && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(u);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                              <Edit2 size={14} className="text-blue-500" /> Edit Member
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetPassword(u.email);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                              <Key size={14} className="text-amber-500" /> Reset Password
                            </button>
                            <div className="h-px bg-slate-100 my-1 mx-2"></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(u.id);
                                setOpenDropdownId(null);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${u.status === 'ACTIVE' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            >
                              <UserX size={14} /> {u.status === 'ACTIVE' ? 'Deactivate Member' : 'Activate Member'}
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
      </div>

      {/* Add/Edit Member Modal */}
      {isModalOpen && createPortal(
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:pt-24 pb-4 sm:pb-8 bg-slate-900/50 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-full overflow-hidden ${isClosing ? 'animate-slide-out-left' : 'animate-slide-in-left'}`}>
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit Member' : 'Add New Member'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{isEditing ? 'Update account details.' : 'Create a new account for your staff.'}</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                
                {/* Basic Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" required
                      value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                      placeholder="e.g. Amit Sharma"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" required
                      value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                      placeholder="amit@prathamtours.com"
                    />
                  </div>
                </div>

                {!isEditing && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Temporary Password</label>
                    <input 
                      type="text" required
                      value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                      placeholder="Enter a secure password..."
                    />
                    <p className="text-[10px] text-slate-500">The user can change this password later after logging in.</p>
                  </div>
                )}

                <div className="h-px bg-slate-100 my-4"></div>

                {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                  <>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <Shield size={14} className="text-blue-500" /> Assign Role
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ROLES.map((role) => (
                          <div 
                            key={role.value}
                            onClick={() => setFormData({...formData, role: role.value})}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              formData.role === role.value 
                              ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-bold ${formData.role === role.value ? 'text-blue-700' : 'text-slate-700'}`}>
                                {role.label}
                              </span>
                              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                formData.role === role.value ? 'border-blue-600' : 'border-slate-300'
                              }`}>
                                {formData.role === role.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                              </div>
                            </div>
                            <p className={`text-[10px] leading-snug ${formData.role === role.value ? 'text-blue-600/80' : 'text-slate-500'}`}>
                              {role.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <Briefcase size={14} className="text-blue-500" /> Assign Branch
                      </label>
                      <select 
                        value={formData.branchId || ''} 
                        onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                      >
                        <option value="">-- Select Branch --</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

              </div>

              <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  {isEditing ? 'Update Member' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default TeamManager;
