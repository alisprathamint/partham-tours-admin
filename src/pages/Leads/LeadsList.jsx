import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, MapPin, Calendar, Clock, IndianRupee } from 'lucide-react';
import api from '../../api/axios';

const LeadsList = () => {
  const { user, token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await api.get('/custom-package-requests');
        const data = response.data;
        
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

  // Pagination calculation
  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = leads.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Customer Leads</h2>
          <p className="text-sm text-slate-700 mt-1">
            Viewing inquiries for: <span className="font-semibold text-blue-600">{user?.region}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-700">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-slate-700">
            No inquiries found for your region.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-800 uppercase tracking-wider">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Route</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 align-top">
                        <div className="font-medium text-slate-900">{lead.full_name}</div>
                        <div className="text-sm text-slate-700">{lead.phone}</div>
                        <div className="text-sm text-slate-700">{lead.email}</div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <MapPin size={16} className="text-blue-500" />
                          {lead.departure_location}
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 mt-1 pl-1">
                          <div className="w-px h-4 bg-slate-300 ml-1.5"></div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <MapPin size={16} className="text-green-500" />
                          {lead.destination}
                        </div>
                      </td>
                      <td className="p-4 align-top space-y-1 text-sm text-slate-800">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-800" />
                          {new Date(lead.start_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-800" />
                          {lead.duration}
                        </div>
                        <div className="flex items-center gap-2">
                          <IndianRupee size={14} className="text-slate-800" />
                          Budget: {lead.budget}
                        </div>
                      </td>
                      <td className="p-4 align-top text-sm text-slate-700">
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

            {/* Pagination Controls */}
            {leads.length > itemsPerPage && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-750">
                      Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{' '}
                      <span className="font-semibold text-slate-900">{Math.min(endIndex, leads.length)}</span> of{' '}
                      <span className="font-semibold text-slate-900">{leads.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        &larr;
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 font-semibold'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        &rarr;
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LeadsList;
