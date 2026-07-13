import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, MapPin, Phone, Mail, Building2, MoreVertical, Edit2, Trash2, X, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Mock Data for Branches
const MOCK_BRANCHES = [
  { 
    id: 1, 
    name: 'Head Office (Mumbai)', 
    isMain: true,
    status: 'ACTIVE',
    phone: '+91 98765 43210',
    email: 'mumbai@prathamtours.com',
    address: '402, Platinum Tower, Andheri East, Mumbai, Maharashtra 400069',
    employeeCount: 12
  },
  { 
    id: 2, 
    name: 'Delhi Branch', 
    isMain: false,
    status: 'ACTIVE',
    phone: '+91 98765 43211',
    email: 'delhi@prathamtours.com',
    address: '105, Connaught Place, New Delhi 110001',
    employeeCount: 8
  },
  { 
    id: 3, 
    name: 'Dubai Operations', 
    isMain: false,
    status: 'INACTIVE',
    phone: '+971 50 123 4567',
    email: 'dubai@prathamtours.com',
    address: 'Business Bay, Dubai, UAE',
    employeeCount: 0
  }
];

const BranchManager = () => {
  const { token } = useAuth();
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/branches', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setBranches(data.data.map(b => ({
            id: b.id,
            name: b.name,
            isMain: b.name.toLowerCase().includes('head office'),
            status: 'ACTIVE',
            phone: '+91 00000 00000',
            email: `${b.name.split(' ')[0].toLowerCase()}@prathamtours.com`,
            address: b.city,
            employeeCount: b._count?.users || 0
          })));
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
      }
    };
    if (token) fetchBranches();
  }, [token]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState(null);
  
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
  
  // New Branch Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    isMain: false,
    status: 'ACTIVE'
  });

  const [openDropdownId, setOpenDropdownId] = useState(null);

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

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingBranchId(null);
    setFormData({ name: '', phone: '', email: '', address: '', isMain: false, status: 'ACTIVE' });
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleEditClick = (branch) => {
    setIsEditing(true);
    setEditingBranchId(branch.id);
    setFormData({
      name: branch.name,
      phone: branch.phone,
      email: branch.email,
      address: branch.address,
      isMain: branch.isMain,
      status: branch.status
    });
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleDeleteBranch = (branchId) => {
    if (confirm("Are you sure you want to delete this branch?")) {
      setBranches(branches.filter(b => b.id !== branchId));
    }
    setOpenDropdownId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let updatedBranches = [...branches];
    
    // If making this the main branch, unset others (UI logic only for now)
    if (formData.isMain) {
      updatedBranches = updatedBranches.map(b => ({ ...b, isMain: false }));
    }

    if (isEditing) {
      updatedBranches = updatedBranches.map(b => {
        if (b.id === editingBranchId) {
          return {
            ...b,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            isMain: formData.isMain,
            status: formData.status
          };
        }
        return b;
      });
    } else {
      const newBranch = {
        id: Date.now(),
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        isMain: formData.isMain,
        status: formData.status,
        employeeCount: 0
      };
      updatedBranches.push(newBranch);
    }
    
    setBranches(updatedBranches);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Branch Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your physical offices and contact details across locations.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search branches..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus size={16} /> Add Branch
          </button>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300">
            <Building2 size={40} className="text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">No branches found.</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query.</p>
          </div>
        ) : (
          filteredBranches.map((branch) => (
            <div key={branch.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              {/* Highlight bar for main branch */}
              {branch.isMain && <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>}
              
              <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                <div className="flex gap-3 items-start">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    branch.isMain ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 leading-tight">{branch.name}</h3>
                      {branch.isMain && <Star size={12} className="text-amber-400 fill-amber-400" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {branch.status === 'ACTIVE' ? (
                        <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase">Active</span>
                      ) : (
                        <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase">Inactive</span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">{branch.employeeCount} Employees</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(openDropdownId === branch.id ? null : branch.id);
                    }}
                    className={`text-slate-400 hover:text-slate-700 p-1 rounded transition-colors ${openDropdownId === branch.id ? 'bg-slate-100 text-slate-700' : 'hover:bg-slate-50'}`}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {/* Dropdown */}
                  {openDropdownId === branch.id && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditClick(branch); }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit2 size={12} /> Edit Details
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteBranch(branch.id); }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-600 leading-snug">{branch.address}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone size={16} className="text-slate-400 shrink-0" />
                  <span className="text-slate-600">{branch.phone}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <span className="text-slate-600 truncate">{branch.email}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Branch Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:pt-24 pb-4 sm:pb-8 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-full overflow-hidden">
            
            {/* Modal Header - Fixed at Top */}
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800">{isEditing ? 'Edit Branch' : 'Add New Branch'}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{isEditing ? 'Update branch details.' : 'Enter the details for your new office location.'}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
              
              {/* Scrollable Form Body */}
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3.5">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Branch Name</label>
                  <input 
                    type="text" required
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                    placeholder="e.g. Pune City Office"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Phone Number</label>
                    <input 
                      type="text" required
                      value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" required
                      value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                      placeholder="pune@prathamtours.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Full Address</label>
                  <textarea 
                    required rows="2"
                    value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors resize-none"
                    placeholder="Enter complete postal address..."
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-5">
                  <div className="flex items-center gap-2.5">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.isMain}
                        onChange={(e) => setFormData({...formData, isMain: e.target.checked})}
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Set as Main Office</p>
                      <p className="text-[9px] text-slate-500">This address will be used in invoices.</p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex items-center gap-2.5">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.status === 'ACTIVE'}
                          onChange={(e) => setFormData({...formData, status: e.target.checked ? 'ACTIVE' : 'INACTIVE'})}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Branch is Active</p>
                        <p className="text-[9px] text-slate-500">Hide inactive branches from system.</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer - Fixed at Bottom */}
              <div className="p-4 sm:p-4 border-t border-slate-100 flex justify-end gap-2 bg-white shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  {isEditing ? 'Update Branch' : 'Save Branch'}
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

export default BranchManager;
