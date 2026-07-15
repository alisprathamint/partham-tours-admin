import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, LogOut, ChevronDown, User as UserIcon, AlertCircle, CheckCircle, Clock, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileModal from '../ProfileModal';
import { useNotifications } from '../../context/NotificationContext';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const [showDropdown, setShowDropdown] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Default to dark theme if no preference is saved
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState('All');
  const notifRef = useRef(null);
  
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) markAsRead(notif.id);
    setShowNotifications(false);
    
    // In future, you can navigate based on notif.relatedEntity
    if (notif.relatedEntity === 'LEAD') {
      navigate('/crm/leads');
    }
  };

  const markAllRead = () => {
    markAllAsRead();
  };

  // Maps backend data to frontend tab filters (assuming type is INFO/SUCCESS/WARNING)
  const getTabFromType = (type) => {
    if (type === 'INFO') return 'Leads';
    if (type === 'SUCCESS') return 'Payments';
    if (type === 'WARNING' || type === 'ERROR') return 'Alerts';
    return 'All';
  };

  const filteredNotifs = activeNotifTab === 'All' 
    ? notifications 
    : notifications.filter(n => getTabFromType(n.type) === activeNotifTab);

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) + ', ' + d.toLocaleDateString();
  };

  const getIconStyles = (type) => {
    switch (type) {
      case 'SUCCESS': return { bg: 'bg-emerald-100', color: 'text-emerald-600' };
      case 'WARNING': return { bg: 'bg-amber-100', color: 'text-amber-600' };
      case 'ERROR': return { bg: 'bg-red-100', color: 'text-red-600' };
      default: return { bg: 'bg-blue-100', color: 'text-blue-600' };
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shadow-sm sticky top-0 z-[60]">
      <div className="flex items-center gap-8">
        <div className="hidden sm:block">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {getGreeting()}, <span className="font-extrabold underline decoration-2 underline-offset-4">{user?.name?.split(' ')[0] || 'Admin'}</span>! <span className="text-2xl inline-block ml-1 hover:animate-bounce cursor-default">👋</span>
          </h2>
          <p className="text-sm text-slate-700 font-medium mt-0.5">Here's what's happening with your tours today.</p>
        </div>
        

      </div>
      
      <div className="flex items-center gap-4 sm:gap-6">
        
        {/* Theme Toggle */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="relative p-2 text-slate-700 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 text-slate-700 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors ${showNotifications ? 'bg-slate-100' : ''}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute -right-14 sm:right-0 mt-3 w-[320px] sm:w-[360px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200">
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
                <h3 className="font-bold text-slate-800 text-[15px]">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-blue-600 text-xs font-semibold hover:text-blue-700">Mark all read</button>
                )}
              </div>
              
              {/* Tabs */}
              <div className="px-5 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto custom-scrollbar bg-slate-50/50">
                {['All', 'Leads', 'Payments', 'Alerts'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveNotifTab(tab)}
                    className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-colors whitespace-nowrap ${
                      activeNotifTab === tab 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="max-h-[320px] overflow-y-auto custom-scrollbar bg-slate-50/30">
                {filteredNotifs.length > 0 ? (
                  filteredNotifs.map(notif => {
                    const styles = getIconStyles(notif.type);
                    return (
                    <div 
                      key={notif.id} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-3 cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : 'bg-white'}`}
                    >
                      <div className={`w-7 h-7 rounded-full ${styles.bg} ${styles.color} flex items-center justify-center shrink-0 mt-0.5`}>
                        <AlertCircle size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <h4 className="font-bold text-slate-800 text-[12px] leading-snug truncate pr-2">{notif.title}</h4>
                          {!notif.isRead && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase bg-blue-100 text-blue-600">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed mb-1 line-clamp-2">{notif.message}</p>
                        <span className="text-[9px] font-medium text-slate-800">{formatTime(notif.createdAt)}</span>
                      </div>
                    </div>
                  )})
                ) : (
                  <div className="p-6 text-center bg-white">
                    <CheckCircle className="mx-auto text-slate-300 mb-2" size={24} />
                    <p className="text-xs font-medium text-slate-800">All caught up!</p>
                    <p className="text-[10px] text-slate-800 mt-1">No {activeNotifTab.toLowerCase()} notifications.</p>
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide">View All Activity</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:flex flex-col items-start text-left">
              <span className="text-sm font-semibold text-slate-800 leading-tight">{user?.name || 'User'}</span>
              <span className="text-xs text-slate-700 leading-tight">{user?.role}</span>
            </div>
            <ChevronDown size={16} className="text-slate-800" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-700">{user?.role}</p>
              </div>
              <button 
                onClick={() => {
                  setShowDropdown(false);
                  setIsProfileModalOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 flex items-center gap-2"
              >
                <UserIcon size={16} />
                Edit Profile
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    <ProfileModal 
      isOpen={isProfileModalOpen} 
      onClose={() => setIsProfileModalOpen(false)} 
    />
    </>
  );
};

export default Header;
