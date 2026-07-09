import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, MapPin, Users, Phone, LayoutTemplate, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { title: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'SALES'] },
    { title: 'Customer Leads', path: '/leads', icon: <FileText size={20} />, roles: ['ADMIN', 'SALES'] },
    
    // Admin Only Sections
    { title: 'CMS (Website)', isHeader: true, roles: ['ADMIN'] },
    { title: 'General Content', path: '/cms/general', icon: <LayoutTemplate size={20} />, roles: ['ADMIN'] },
    { title: 'Our Team', path: '/cms/team', icon: <Users size={20} />, roles: ['ADMIN'] },
    { title: 'Contact Info', path: '/cms/contact', icon: <Phone size={20} />, roles: ['ADMIN'] },
    
    { title: 'Tours & Travels', isHeader: true, roles: ['ADMIN'] },
    { title: 'Packages', path: '/packages', icon: <Package size={20} />, roles: ['ADMIN'] },
    { title: 'Destinations', path: '/destinations', icon: <MapPin size={20} />, roles: ['ADMIN'] },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shadow-sm flex-shrink-0 flex flex-col h-full z-20">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-blue-600 tracking-tight flex items-center gap-2">
          <span className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Package size={20} />
          </span>
          Pratham Admin
        </h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item, index) => {
          // Hide items if user role is not authorized
          if (user && !item.roles.includes(user.role)) return null;

          if (item.isHeader) {
            return (
              <div key={index} className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {item.title}
              </div>
            );
          }
          
          return (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <span className="opacity-80">{item.icon}</span>
              {item.title}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-4 py-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role} • {user?.region}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
