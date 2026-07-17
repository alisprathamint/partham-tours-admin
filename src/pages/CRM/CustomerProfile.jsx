import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import LeadProfileForm from './LeadProfileForm';
import QueryDetailProfile from './QueryDetailProfile';

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const passedLead = location.state?.lead || {};
  const [currentLead, setCurrentLead] = useState(passedLead.id || passedLead._id ? passedLead : null);
  const [loading, setLoading] = useState(!currentLead);

  const fetchLeadDetails = async () => {
    try {
      const typeParam = currentLead?.type || 'QUERY';
      const res = await api.get(`/crm/leads?type=${typeParam}`);
      if (res.data.success) {
        const found = res.data.data.find(l => String(l.id) === String(id) || String(l._id) === String(id));
        if (found) {
          setCurrentLead(found);
        }
      }
    } catch (err) {
      console.error('Error fetching lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentLead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <span className="text-slate-500 font-bold text-sm">Lead details not found.</span>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 shadow"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (currentLead.type === 'QUERY') {
    return (
      <QueryDetailProfile 
        currentLead={currentLead} 
        fetchLeadDetails={fetchLeadDetails} 
        navigate={navigate}
        user={user}
      />
    );
  }

  return (
    <LeadProfileForm 
      lead={currentLead} 
      navigate={navigate}
      user={user}
    />
  );
};

export default CustomerProfile;
