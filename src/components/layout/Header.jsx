import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, LogOut, ChevronDown, User as UserIcon, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../ProfileModal';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState('All');
  const notifRef = useRef(null);
  const INITIAL_NOTIFICATIONS = [
    { id: 1, type: 'Leads', title: 'New lead assigned: Rahul Sharma', desc: 'Rahul Sharma has inquired about the Dubai 5N/6D Package. Follow up before 4 PM.', time: '11:27 AM, Today', badge: 'New', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', isRead: false, link: '/crm/leads' },
    { id: 2, type: 'Payments', title: 'Payment received for Kerala Tour', desc: '₹50,000 partial payment received from Neha Gupta. Verify the transaction details.', time: '10:00 AM, Today', badge: '', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', isRead: false, link: '/crm/leads' },
    { id: 3, type: 'Alerts', title: 'Visa rejection for ID #1042', desc: 'Visa application for customer Amit Kumar has been rejected. Immediate action required.', time: '09:15 AM, Yesterday', badge: 'Alert', iconBg: 'bg-red-100', iconColor: 'text-red-600', isRead: true, link: '/crm/leads' }
  ];

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const handleNotificationClick = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const filteredNotifs = activeNotifTab === 'All' ? notifications : notifications.filter(n => n.type === activeNotifTab);
  const unreadCount = notifications.filter(n => !n.isRead).length;

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
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-8">
        <div className="hidden sm:block">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}! <span className="text-2xl inline-block ml-1 hover:animate-bounce cursor-default">👋</span>
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Here's what's happening with your tours today.</p>
        </div>
        
        <div className="relative hidden md:block">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all w-64"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors ${showNotifications ? 'bg-slate-100' : ''}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-[360px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200">
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
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="max-h-[380px] overflow-y-auto custom-scrollbar bg-slate-50/30">
                {filteredNotifs.length > 0 ? (
                  filteredNotifs.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-4 cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : 'bg-white'}`}
                    >
                      <div className={`w-9 h-9 rounded-full ${notif.iconBg} ${notif.iconColor} flex items-center justify-center shrink-0`}>
                        <AlertCircle size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-bold text-slate-800 text-[13px] leading-snug truncate pr-2">{notif.title}</h4>
                          {notif.badge && (
                            <span className="shrink-0 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-red-100 text-red-600">
                              {notif.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">{notif.desc}</p>
                        <span className="text-[10px] font-medium text-slate-400">{notif.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-white">
                    <CheckCircle className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-sm font-medium text-slate-600">All caught up!</p>
                    <p className="text-xs text-slate-400 mt-1">No {activeNotifTab.toLowerCase()} notifications.</p>
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
              <span className="text-xs text-slate-500 leading-tight">{user?.role}</span>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
              <button 
                onClick={() => {
                  setShowDropdown(false);
                  setIsProfileModalOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
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
