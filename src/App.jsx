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
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  
  return children;
};

// Placeholder Pages (we will create these files next)
const Dashboard = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Total Packages</div>
        <div className="text-4xl font-bold text-slate-800">24</div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Active Leads</div>
        <div className="text-4xl font-bold text-blue-600">12</div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Revenue This Month</div>
        <div className="text-4xl font-bold text-emerald-600">₹4.5L</div>
      </div>
    </div>
  </div>
);

const TeamManager = () => <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200"><h2 className="text-2xl font-bold mb-4">Team Manager</h2><p className="text-slate-500">Add or remove team members here.</p></div>;

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
          
          {/* Admin Only Routes */}
          <Route path="cms/general" element={<ProtectedRoute allowedRoles={['ADMIN']}><GeneralContent /></ProtectedRoute>} />
          <Route path="cms/homepage" element={<ProtectedRoute allowedRoles={['ADMIN']}><HomePageSections /></ProtectedRoute>} />
          <Route path="cms/contact" element={<ProtectedRoute allowedRoles={['ADMIN']}><ContactInfo /></ProtectedRoute>} />
          <Route path="packages" element={<ProtectedRoute allowedRoles={['ADMIN']}><PackageList /></ProtectedRoute>} />
          <Route path="packages/new" element={<ProtectedRoute allowedRoles={['ADMIN']}><PackageEditor /></ProtectedRoute>} />
          <Route path="packages/edit/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><PackageEditor /></ProtectedRoute>} />
          <Route path="destinations" element={<ProtectedRoute allowedRoles={['ADMIN']}><DestinationList /></ProtectedRoute>} />
          <Route path="destinations/new" element={<ProtectedRoute allowedRoles={['ADMIN']}><DestinationEditor /></ProtectedRoute>} />
          <Route path="destinations/edit/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><DestinationEditor /></ProtectedRoute>} />
          <Route path="cms/team" element={<ProtectedRoute allowedRoles={['ADMIN']}><TeamManager /></ProtectedRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
