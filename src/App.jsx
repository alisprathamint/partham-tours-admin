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
import LeadsList from './pages/Leads/LeadsList';
import LeadsPool from './pages/CRM/LeadsPool';
import QueriesPipeline from './pages/CRM/QueriesPipeline';
import Dashboard from './pages/Dashboard/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  
  return children;
};

// The Dashboard is now imported from './pages/Dashboard/Dashboard'

import TeamManager from './pages/Team/TeamManager';
import BranchManager from './pages/Branches/BranchManager';

const ComingSoon = ({ title }) => (
  <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center min-h-[400px]">
    <h2 className="text-3xl font-bold text-slate-800 mb-2">{title}</h2>
    <p className="text-slate-500 text-lg">This module is under development and will be available soon.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
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
          <Route path="crm/queries" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE', 'SALES']}><QueriesPipeline /></ProtectedRoute>} />
          
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
    </AuthProvider>
  );
}

export default App;
