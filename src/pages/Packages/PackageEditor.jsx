import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Image as ImageIcon, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PackageEditor = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    category: '',
    price: '',
    duration: '',
    description: '',
    featured: false,
    highlights: [],
    inclusions: [],
    exclusions: [],
    itinerary: []
  });
  
  const [destinations, setDestinations] = useState([]);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [newDestination, setNewDestination] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!isNew);

  useEffect(() => {
    // Fetch available destinations
    fetch('http://localhost:5000/api/packages')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDestinations(data.destinations);
        }
      });

    if (!isNew) {
      // Fetch package details for editing
      fetch(`http://localhost:5000/api/packages/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFormData(data.package);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [id, isNew]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.split('\n').filter(item => item.trim() !== '')
    }));
  };

  const handleItineraryChange = (index, field, value) => {
    const newItinerary = [...(formData.itinerary || [])];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    setFormData(prev => ({ ...prev, itinerary: newItinerary }));
  };

  const addItineraryDay = () => {
    const newItinerary = [...(formData.itinerary || [])];
    newItinerary.push({ 
      day: newItinerary.length + 1, 
      title: '', 
      activities: [] 
    });
    setFormData(prev => ({ ...prev, itinerary: newItinerary }));
  };

  const removeItineraryDay = (index) => {
    const newItinerary = [...(formData.itinerary || [])];
    newItinerary.splice(index, 1);
    // Re-number days
    newItinerary.forEach((day, i) => day.day = i + 1);
    setFormData(prev => ({ ...prev, itinerary: newItinerary }));
  };

  const handleCreateDestination = async () => {
    if (!newDestination.trim()) return;
    
    // In a real app, you would POST to /api/destinations here
    const tempDest = { id: Date.now(), name: newDestination };
    setDestinations(prev => [...prev, tempDest]);
    setFormData(prev => ({ ...prev, location: newDestination }));
    setShowDestinationModal(false);
    setNewDestination('');
    
    alert(`Destination "${newDestination}" created successfully and selected!`);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const url = isNew ? 'http://localhost:5000/api/packages' : `http://localhost:5000/api/packages/${id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(isNew ? 'Package created successfully!' : 'Package updated successfully!');
        navigate('/packages');
      } else {
        alert(`Failed to save: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving the package.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading package details...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/packages')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {isNew ? 'Create New Package' : 'Edit Package'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isNew ? 'Add a new travel package.' : 'Update existing package details.'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Package'}
        </button>
      </div>

      {/* Editor Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-800 mb-4">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Package Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                placeholder="e.g. Exotic Bali Adventure"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                <input 
                  type="text" 
                  name="price"
                  value={formData.price || ''}
                  onChange={handleChange}
                  placeholder="e.g. 45000"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                <input 
                  type="text" 
                  name="duration"
                  value={formData.duration || ''}
                  onChange={handleChange}
                  placeholder="e.g. 5 Days, 4 Nights"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (Overview)</label>
              <textarea 
                name="description"
                rows="5"
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              ></textarea>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-800 mb-4">Highlights & Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Highlights (One per line)</label>
              <textarea 
                name="highlights"
                rows="4"
                value={(formData.highlights || []).join('\n')}
                onChange={handleArrayChange}
                placeholder="e.g. Visit to Taj Mahal\nElephant Safari in Kaziranga"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Inclusions (One per line)</label>
                <textarea 
                  name="inclusions"
                  rows="4"
                  value={(formData.inclusions || []).join('\n')}
                  onChange={handleArrayChange}
                  placeholder="e.g. Hotel Stay\nBreakfast included"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Exclusions (One per line)</label>
                <textarea 
                  name="exclusions"
                  rows="4"
                  value={(formData.exclusions || []).join('\n')}
                  onChange={handleArrayChange}
                  placeholder="e.g. Flight tickets\nPersonal expenses"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Itinerary</h3>
              <button 
                onClick={addItineraryDay}
                className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 font-medium transition-colors"
              >
                + Add Day
              </button>
            </div>
            
            <div className="space-y-4">
              {(!formData.itinerary || formData.itinerary.length === 0) ? (
                <div className="text-center p-4 text-slate-500 border border-dashed rounded-lg">
                  No itinerary added yet. Click "+ Add Day" to start building.
                </div>
              ) : formData.itinerary.map((day, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
                  <button 
                    onClick={() => removeItineraryDay(index)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                  <div className="font-medium text-sm text-blue-600 mb-3">Day {day.day}</div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Day Title</label>
                      <input 
                        type="text" 
                        value={day.title || ''}
                        onChange={(e) => handleItineraryChange(index, 'title', e.target.value)}
                        placeholder="e.g. Arrival in Paro"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Activities (One per line)</label>
                      <textarea 
                        rows="3"
                        value={Array.isArray(day.activities) ? day.activities.join('\n') : (day.activities || '')}
                        onChange={(e) => handleItineraryChange(index, 'activities', e.target.value.split('\n').filter(i => i.trim() !== ''))}
                        placeholder="e.g. Check into hotel\nVisit National Museum"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-800 mb-2">Location & Category</h3>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Destination</label>
                <button 
                  onClick={() => setShowDestinationModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add New
                </button>
              </div>
              <select
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Select a destination...</option>
                {destinations.map(dest => (
                  <option key={dest.id} value={dest.name}>{dest.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Select a category...</option>
                <option value="International">International</option>
                <option value="Domestic">Domestic</option>
                <option value="Honeymoon">Honeymoon</option>
                <option value="Adventure">Adventure</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <label htmlFor="featured" className="ml-2 block text-sm text-slate-700">
                Mark as Featured Package
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-800 mb-2">Package Image</h3>
            
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-lg hover:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden">
              {formData.image ? (
                <div className="absolute inset-0">
                  <img src={formData.image.startsWith('http') ? formData.image : formData.image.startsWith('/uploads') ? `http://localhost:5000${formData.image}` : (formData.image.startsWith('/') ? formData.image : '/' + formData.image)} className="w-full h-full object-cover" alt="Package preview" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white font-medium">
                    Change Image
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-600 justify-center">
                    <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seamless Destination Creation Modal */}
      {showDestinationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Add New Destination</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">Create a destination on-the-fly without leaving this page.</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destination Name</label>
                <input 
                  type="text" 
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  placeholder="e.g. Switzerland"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowDestinationModal(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateDestination}
                disabled={!newDestination.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                Create & Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageEditor;
