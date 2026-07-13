import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, MoreVertical, Edit2, Key, UserX, Users, Shield, Briefcase, Building, Mail, X } from 'lucide-react';

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

const TeamManager = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
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
            branch: u.branch?.name || 'Unassigned',
            status: 'ACTIVE',
            joined: new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          })));
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    if (token) fetchUsers();
  }, [token]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setFormData({ name: '', email: '', password: '', role: 'SALES_EXECUTIVE', branch: 'Head Office (Mumbai)' });
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
      branch: userToEdit.branch
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (userId) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' };
      }
      return u;
    }));
  };

  const handleResetPassword = (email) => {
    // Mock functionality
    alert(`A password reset link has been sent to ${email}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isEditing) {
      setUsers(users.map(u => {
        if (u.id === editingUserId) {
          return {
            ...u,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            branch: formData.branch,
          };
        }
        return u;
      }));
    } else {
      const newUser = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        branch: formData.branch,
        status: 'ACTIVE',
        joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
      setUsers([...users, newUser]);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Team & Users</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your staff, assign roles, and control access to the CRM.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus size={16} /> Add Member
          </button>
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
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleResetPassword(u.email)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" 
                          title="Reset Password"
                        >
                          <Key size={16} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(u.id)}
                          className={`p-1.5 rounded transition-colors ${
                            u.status === 'ACTIVE' 
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                              : 'text-rose-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.status === 'ACTIVE' ? "Deactivate User" : "Activate User"}
                        >
                          <UserX size={16} />
                        </button>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:pt-24 pb-4 sm:pb-8 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-full overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit Member' : 'Add New Member'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{isEditing ? 'Update account details.' : 'Create a new account for your staff.'}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
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

                {/* Role Selection */}
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

                {/* Branch Selection */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Briefcase size={14} className="text-blue-500" /> Assign Branch
                  </label>
                  <select 
                    value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  >
                    <option>Head Office (Mumbai)</option>
                    <option>Delhi Branch</option>
                    <option>Remote / Work from Home</option>
                  </select>
                </div>

              </div>

              <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
