import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, MapPin, Calendar, Clock, IndianRupee } from 'lucide-react';

const LeadsList = () => {
  const { user, token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/custom-package-requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setLeads(data.data);
        }
      } catch (err) {
        console.error('Error fetching leads:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchLeads();
    }
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Customer Leads</h2>
          <p className="text-sm text-slate-500 mt-1">
            Viewing inquiries for: <span className="font-semibold text-blue-600">{user?.region}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No inquiries found for your region.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-medium text-slate-900">{lead.full_name}</div>
                      <div className="text-sm text-slate-500">{lead.phone}</div>
                      <div className="text-sm text-slate-500">{lead.email}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <MapPin size={16} className="text-blue-500" />
                        {lead.departure_location}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 mt-1 pl-1">
                        <div className="w-px h-4 bg-slate-300 ml-1.5"></div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <MapPin size={16} className="text-green-500" />
                        {lead.destination}
                      </div>
                    </td>
                    <td className="p-4 align-top space-y-1 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(lead.start_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        {lead.duration}
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee size={14} className="text-slate-400" />
                        Budget: {lead.budget}
                      </div>
                    </td>
                    <td className="p-4 align-top text-sm text-slate-500">
                      {new Date(lead.request_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-top">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lead.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {lead.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsList;
