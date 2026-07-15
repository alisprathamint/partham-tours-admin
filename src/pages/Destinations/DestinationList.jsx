import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { getImageUrl } from '../../utils/imageHelper';

const DestinationList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [destinations, setDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    api.get('/destinations')
      .then(res => res.data)
      .then(data => {
        if (data.success) {
          setDestinations(data.data.destinations);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this destination?")) {
      try {
        const res = await api.delete(`/destinations/${id}`);
        const data = res.data;
        if (data.success) {
          setDestinations(prev => prev.filter(d => d.id !== id));
        } else {
          alert('Failed to delete destination.');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Destinations</h2>
          <p className="text-sm text-slate-700 mt-1">Manage travel destinations and their details.</p>
        </div>
        <button 
          onClick={() => navigate('/destinations/new')}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Destination</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <input 
            type="text"
            placeholder="Search destinations..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-800" size={18} />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-700">Loading destinations...</div>
      ) : destinations.length === 0 ? (
        <div className="p-12 text-center text-slate-700 bg-white rounded-xl border border-dashed border-slate-300">
          No destinations found. Create your first destination!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map(dest => (
            <div 
              key={dest.id} 
              onClick={() => navigate(`/destinations/edit/${dest.id}`)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col cursor-pointer"
            >
              <div className="h-40 bg-slate-200 relative overflow-hidden">
                {dest.image ? (
                  <img 
                    src={getImageUrl(dest.image)} 
                    alt={dest.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800 bg-slate-100">
                    No Image
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/destinations/edit/${dest.id}`); }} 
                    className="p-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-lg shadow-sm transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(dest.id); }} 
                    className="p-1.5 bg-white/90 hover:bg-red-50 text-red-600 rounded-lg shadow-sm transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-grow justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-1">{dest.name}</h3>
                  <p className="text-sm text-slate-700 line-clamp-2">
                    {dest.description || 'No description provided.'}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {dest.count} Packages
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DestinationList;
