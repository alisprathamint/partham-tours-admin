import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, LayoutTemplate, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen }) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [isReady, setIsReady] = useState(false);
  const location = useLocation();
  const sidebarRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Force expanded state for pre-rendering
  const [preRender, setPreRender] = useState(false);

  const isExpanded = isOpen || isHovered || preRender;

  const menuItems = useMemo(() => [
    { title: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE', 'SALES'] },
    {
      title: 'CRM / Sales',
      icon: <FileText size={20} />,
      roles: ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE', 'SALES'],
      subItems: [
        { title: 'Leads Pool', path: '/crm/leads' },
        { title: 'My Queries', path: '/crm/queries' },
        { title: 'Team Pipeline', path: '/crm/team-pipeline', roles: ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'] },
        { title: 'Confirmed Queries', path: '/crm/confirmed-queries', roles: ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'] }
      ]
    },
    {
      title: 'Branch Management',
      icon: <LayoutDashboard size={20} />, // You might want to import Users icon, but using LayoutDashboard for now
      roles: ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'],
      subItems: [
        { title: 'Branches', path: '/branches', roles: ['SUPER_ADMIN', 'ADMIN'] },
        { title: 'Users & Team', path: '/users', roles: ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'] }
      ]
    },
    {
      title: 'Website CMS',
      icon: <LayoutTemplate size={20} />,
      roles: ['SUPER_ADMIN', 'ADMIN'],
      subItems: [
        { title: 'Home Page Sections', path: '/cms/homepage' },
        { title: 'General Content', path: '/cms/general' },
        { title: 'Our Team', path: '/cms/team' },
        { title: 'Contact Info', path: '/cms/contact' }
      ]
    },
    {
      title: 'Tours & Travels',
      icon: <Package size={20} />,
      roles: ['SUPER_ADMIN', 'ADMIN'],
      subItems: [
        { title: 'Packages', path: '/packages' },
        { title: 'Destinations', path: '/destinations' }
      ]
    },
  ], []);

  useEffect(() => {
    setIsReady(true);
  }, []);

  // Auto-expand modules
  useEffect(() => {
    const newExpandedState = { ...expandedModules };
    let changed = false;

    menuItems.forEach(item => {
      if (item.subItems) {
        const isActiveModule = item.subItems.some(subItem => location.pathname.startsWith(subItem.path));
        if (isActiveModule && !expandedModules[item.title]) {
          newExpandedState[item.title] = true;
          changed = true;
        }
      }
    });

    if (changed) {
      setExpandedModules(newExpandedState);
    }
  }, [location.pathname, menuItems]);

  const toggleModule = useCallback((title) => {
    if (!isExpanded) return;
    setExpandedModules(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  }, [isExpanded]);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const filteredMenuItems = useMemo(() => {
    if (!user) return menuItems;
    return menuItems.reduce((acc, item) => {
      if (!item.roles.includes(user.role)) return acc;
      
      let filteredItem = { ...item };
      
      if (filteredItem.subItems) {
        filteredItem.subItems = filteredItem.subItems.filter(subItem => 
          !subItem.roles || subItem.roles.includes(user.role)
        );
        
        // Only include parent if it still has subitems after filtering
        if (filteredItem.subItems.length === 0) return acc;
      }
      
      acc.push(filteredItem);
      return acc;
    }, []);
  }, [user, menuItems]);

  return (
    <>
      {/* Global styles for smooth animation */}
      <style>{`
        /* Main sidebar transition */
        .sidebar-main {
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        

        /* Text transitions */
        .sidebar-text {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        /* Submenu transitions */
        .sidebar-submenu {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        /* Scrollbar styling */
        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 20px;
        }
        
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        

        /* Ready state - no opacity tricks needed */
        .sidebar-ready {
          opacity: 1 !important;
        }
      `}</style>

      <aside
        ref={sidebarRef}
        className={`
          sidebar-main
          bg-white border-r border-slate-200 shadow-sm 
          flex-shrink-0 flex flex-col h-full z-20 
          overflow-hidden relative
          ${isExpanded ? 'w-64' : 'w-20'}
          ${isReady ? 'sidebar-ready' : ''}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo Section */}
        <div className="border-b border-slate-100 flex items-center h-[72px] px-6 relative overflow-hidden flex-shrink-0 menu-item-gpu">
          <div className="flex items-center w-full">
            <span className="flex-shrink-0 transition-transform duration-300 hover:scale-105">
              <img src="/assets/logos/P Logo.svg" alt="Pratham Tours" className="w-8 h-8 object-contain" />
            </span>
            <div className={`
              sidebar-text
              overflow-hidden
              ${isExpanded ? 'max-w-[200px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'}
            `}>
              <h1 className="font-bold text-blue-600 text-xl whitespace-nowrap">
                Pratham Admin
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 sidebar-scroll">
          <div className="space-y-1">
            {filteredMenuItems.map((item, index) => {
              if (item.subItems) {
                const isModuleExpanded = expandedModules[item.title];
                const isActiveModule = item.subItems.some(subItem => location.pathname.startsWith(subItem.path));

                return (
                  <div key={index} className="flex flex-col mb-1 menu-item-gpu">
                    <button
                      onClick={() => toggleModule(item.title)}
                      title={!isExpanded ? item.title : ""}
                      className={`
                        flex items-center justify-between py-2.5 px-3 rounded-lg font-medium 
                        transition-colors duration-200 ease-in-out w-full relative
                        ${isActiveModule && !isModuleExpanded
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-800 hover:bg-slate-50 hover:text-slate-900'
                        }
                        ${!isExpanded ? 'justify-center' : ''}
                      `}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <span className={`
                          flex-shrink-0 w-6 flex items-center justify-center
                          ${isActiveModule ? 'text-blue-600' : ''}
                        `}>
                          {item.icon}
                        </span>
                        <span className={`
                          sidebar-text
                          whitespace-nowrap overflow-hidden
                          ${isExpanded ? 'max-w-[200px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'}
                          ${isActiveModule ? 'text-blue-700' : ''}
                        `}>
                          {item.title}
                        </span>
                      </div>
                      <span className={`
                        sidebar-text
                        flex-shrink-0
                        ${isExpanded ? 'max-w-[24px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'}
                      `}>
                        {isModuleExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>

                    {/* Submenu */}
                    <div className={`
                      sidebar-submenu
                      flex flex-col ml-9 border-l-2 border-slate-100 space-y-1 
                      overflow-hidden
                      ${isExpanded && isModuleExpanded
                        ? 'max-h-[500px] opacity-100 mt-1'
                        : 'max-h-0 opacity-0'
                      }
                    `}>
                      {item.subItems.map((subItem, subIndex) => (
                        <NavLink
                          key={subIndex}
                          to={subItem.path}
                          className={({ isActive }) => `
                            flex items-center py-2 px-4 rounded-lg text-sm 
                            transition-colors duration-200 ease-in-out ml-2
                            ${isActive
                              ? 'text-blue-700 font-semibold bg-blue-50'
                              : 'text-slate-700 hover:text-slate-800 hover:bg-slate-50'
                            }
                          `}
                        >
                          <span className="whitespace-nowrap">{subItem.title}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <NavLink
                  key={index}
                  to={item.path}
                  title={!isExpanded ? item.title : ""}
                  className={({ isActive }) => `
                    flex items-center px-3 py-2.5 rounded-lg font-medium 
                    transition-colors duration-200 ease-in-out mb-1
                    ${!isExpanded ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-800 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <span className="flex-shrink-0 w-6 flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span className={`
                    sidebar-text
                    whitespace-nowrap overflow-hidden
                    ${isExpanded ? 'max-w-[200px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'}
                  `}>
                    {item.title}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className={`
          border-t border-slate-100 p-4 transition-all duration-300 ease-in-out flex-shrink-0
          ${isExpanded ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="text-xs text-slate-800 text-center">
            {isExpanded && (
              <span className="whitespace-nowrap">v2.0.0</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default React.memo(Sidebar);