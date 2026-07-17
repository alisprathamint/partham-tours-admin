import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import GeneralContent from './pages/CMS/GeneralContent';
import ContactInfo from './pages/CMS/ContactInfo';
import HomePageSections from './pages/CMS/HomePageSections';
import PackageList from './pages/Packages/PackageList';
import PackageEditor from './pages/Packages/PackageEditor';
import DestinationList from './pages/Destinations/DestinationList';
import DestinationEditor from './pages/Destinations/DestinationEditor';
import Login from './pages/Auth/Login';
import CustomerProfile from './pages/CRM/CustomerProfile';
import LeadsList from './pages/Leads/LeadsList';
import LeadsPool from './pages/CRM/LeadsPool';
import MyQueries from './pages/CRM/MyQueries';
import QueriesPipeline from './pages/CRM/QueriesPipeline';
import TeamPipeline from './pages/CRM/TeamPipeline';
import ConfirmedQueries from './pages/CRM/ConfirmedQueries';
import Dashboard from './pages/Dashboard/Dashboard';
import TeamManager from './pages/Team/TeamManager';
import BranchManager from './pages/Branches/BranchManager';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';
import { NotificationProvider } from './context/NotificationContext';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

// Listens for server-pushed 'logout' events via WebSocket and logs the user out
const WsLogoutListener = ({ logout }) => {
  const { subscribe } = useWebSocket();
  useEffect(() => {
    const unsub = subscribe('logout', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    });
    return unsub;
  }, [subscribe, logout]);
  return null;
};

// Inner component that reads token from AuthContext and opens the WS connection
const AppRoutes = () => {
  const { token, logout } = useAuth();
  return (
    <WebSocketProvider token={token}>
      <WsLogoutListener logout={logout} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<LeadsList />} />
          
          {/* CRM Routes */}
          <Route path="crm/leads" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE', 'SALES']}><LeadsPool /></ProtectedRoute>} />
          <Route path="crm/queries/:id" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE', 'SALES']}><CustomerProfile /></ProtectedRoute>} />
          <Route path="crm/my-queries" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE', 'SALES']}><MyQueries /></ProtectedRoute>} />
          <Route path="crm/queries" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE', 'SALES']}><QueriesPipeline /></ProtectedRoute>} />
          <Route path="crm/team-pipeline" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']}><TeamPipeline /></ProtectedRoute>} />
          <Route path="crm/confirmed-queries" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']}><ConfirmedQueries /></ProtectedRoute>} />
          
          {/* Admin Only Routes */}
          <Route path="cms/general" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><GeneralContent /></ProtectedRoute>} />
          <Route path="cms/homepage" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><HomePageSections /></ProtectedRoute>} />
          <Route path="cms/contact" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><ContactInfo /></ProtectedRoute>} />
          <Route path="packages" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><PackageList /></ProtectedRoute>} />
          <Route path="packages/new" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><PackageEditor /></ProtectedRoute>} />
          <Route path="packages/edit/:id" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><PackageEditor /></ProtectedRoute>} />
          <Route path="destinations" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><DestinationList /></ProtectedRoute>} />
          <Route path="destinations/new" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><DestinationEditor /></ProtectedRoute>} />
          <Route path="destinations/edit/:id" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><DestinationEditor /></ProtectedRoute>} />
          <Route path="cms/team" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><TeamManager /></ProtectedRoute>} />
          
          {/* Branch Management Routes */}
          <Route path="branches" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><BranchManager /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']}><TeamManager /></ProtectedRoute>} />
        </Route>
      </Routes>
    </WebSocketProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
