import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const PackageList = () => {
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/packages');
      const data = await response.json();
      if (data.success) {
        setPackages(data.packages);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPackages = packages.filter(pkg => 
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (pkg.location && pkg.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Packages</h2>
          <p className="text-sm text-slate-500 mt-1">Manage all your travel packages and itineraries.</p>
        </div>
        <Link 
          to="/packages/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm w-fit"
        >
          <Plus size={18} />
          Create Package
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search packages by name or location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Packages Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading packages...</div>
      ) : filteredPackages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-slate-800">No packages found</h3>
          <p className="text-slate-500 mt-1">Try adjusting your search or create a new package.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              <div className="h-48 bg-slate-200 relative overflow-hidden">
                {pkg.image ? (
                  <img 
                    src={
                      pkg.image.startsWith('http') 
                        ? pkg.image 
                        : pkg.image.startsWith('/uploads') 
                          ? `http://localhost:5000${pkg.image}` 
                          : pkg.image // Use local admin public folder for legacy assets
                    } 
                    alt={pkg.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                    No Image
                  </div>
                )}
                {pkg.featured && (
                  <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                    Featured
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <Link to={`/packages/edit/${pkg.id}`} className="p-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-lg shadow-sm transition-colors">
                    <Edit size={16} />
                  </Link>
                  <button className="p-1.5 bg-white/90 hover:bg-red-50 text-red-600 rounded-lg shadow-sm transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-slate-800 line-clamp-1 mb-2" title={pkg.name}>{pkg.name}</h3>
                
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="truncate">{pkg.location || 'No location'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Tag size={14} className="text-slate-400" />
                    <span>{pkg.category || 'Uncategorized'}</span>
                  </div>
                </div>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500 block">Price</span>
                    <span className="font-bold text-blue-600">₹{pkg.price || '0'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Duration</span>
                    <span className="font-medium text-slate-700">{pkg.duration || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PackageList;
