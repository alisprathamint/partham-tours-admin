import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Lock, Briefcase, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, token, updateUser } = useAuth();
  const [freshUser, setFreshUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isClosing, setIsClosing] = useState(false);

  // Fetch fresh user data with branch info when modal opens
  useEffect(() => {
    if (isOpen) {
      api.get('/users/me').then(res => {
        if (res.data?.success) setFreshUser(res.data.data);
      }).catch(() => {
        // Fallback to user from context which has branch from login
        setFreshUser(user);
      });
    }
  }, [isOpen]);

  const displayUser = freshUser || user;

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280); // Wait for animation to finish before unmounting
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.put('/profile', {
        name: formData.name,
        email: formData.email,
        ...(formData.password && { password: formData.password })
      });

      const data = response.data;

      if (data.success) {
        updateUser(data.user);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative ${isClosing ? 'animate-slide-out-left' : 'animate-slide-in-left'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between absolute w-full top-0 left-0">
          <h2 className="text-base font-bold text-slate-800">User Profile</h2>
          <button 
            onClick={handleClose}
            className="text-slate-800 hover:text-slate-800 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pt-12">
          {/* Header Profile Section */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl uppercase mb-2">
              {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U'}
            </div>
            <h3 className="text-lg font-bold text-slate-800">{user?.name || 'User'}</h3>
            <p className="text-xs text-slate-700 mt-0.5">{user?.role === 'ADMIN' ? 'Super Admin' : 'Sales Executive'}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {message.text && (
              <div className={`p-2.5 rounded-lg text-xs font-medium mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Read Only Fields */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1">
                  <Briefcase size={14} />
                  Designation
                </label>
                <input
                  type="text"
                  value={displayUser?.role === 'SUPER_ADMIN' ? 'Super Admin' : displayUser?.role === 'ADMIN' ? 'Admin' : displayUser?.role === 'BRANCH_MANAGER' ? 'Branch Manager' : displayUser?.role === 'SALES_EXECUTIVE' ? 'Sales Executive' : 'Sales'}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 cursor-not-allowed focus:outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1">
                  <MapPin size={14} />
                  Region / Branch
                </label>
                <input
                  type="text"
                  value={displayUser?.managedBranch?.name || displayUser?.branch?.name || displayUser?.region || 'Not set'}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 cursor-not-allowed focus:outline-none"
                />
              </div>

              {/* Editable Fields */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-800 mb-1">
                  <User size={14} />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-800 mb-1">
                  <Mail size={14} />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Password Fields */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-800 mb-1">
                  <Lock size={14} />
                  New Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <p className="text-[10px] text-slate-800 mt-1 ml-0.5">• At least 8 characters required</p>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-800 mb-1">
                  <Lock size={14} />
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 text-sm font-medium text-slate-800 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ProfileModal;
