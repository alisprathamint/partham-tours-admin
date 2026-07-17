import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Image as ImageIcon, Upload, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { getImageUrl } from '../../utils/imageHelper';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' }
];

const DestinationEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    favorableMonths: [],
    image: ''
  });
  
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isEditMode) {
      // Fetch existing destination
      api.get('/destinations')
        .then(res => res.data)
        .then(data => {
          if (data.success) {
            const dest = data.data.destinations.find(d => d.id === parseInt(id));
            if (dest) {
              setFormData({
                name: dest.name || '',
                description: dest.description || '',
                favorableMonths: dest.favorableMonths || [],
                image: dest.image || ''
              });
            } else {
              alert("Destination not found");
              navigate('/destinations');
            }
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleMonth = (monthValue) => {
    setFormData(prev => {
      const current = [...prev.favorableMonths];
      if (current.includes(monthValue)) {
        return { ...prev, favorableMonths: current.filter(m => m !== monthValue) };
      } else {
        return { ...prev, favorableMonths: [...current, monthValue].sort((a, b) => a - b) };
      }
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('fieldname', 'destinationImage');

    try {
      const res = await api.post('/upload?folder=destinations', uploadData);
      const result = res.data;
      
      if (result.success && result.file.url) {
        setFormData(prev => ({ ...prev, image: result.file.url }));
      } else {
        alert(result.message || 'Image upload failed');
      }
    } catch (error) {
      console.error(error);
      alert('Error uploading image');
    }
    
    // Reset file input
    e.target.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (!formData.name) {
      alert("Name is required");
      setIsSaving(false);
      return;
    }

    try {
      let response;
      if (isEditMode) {
        response = await api.put(`/destinations/${id}`, formData);
      } else {
        response = await api.post('/destinations', formData);
      }
      
      const data = response.data;
      if (data.success) {
        navigate('/destinations');
      } else {
        alert(data.message || 'Failed to save destination.');
      }
    } catch (err) {
      console.error('Error saving destination:', err);
      alert('Error connecting to server.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-700">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/destinations')}
            className="p-2.5 bg-white text-slate-700 rounded-xl shadow-sm border border-slate-200 hover:text-slate-800 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEditMode ? 'Edit Destination' : 'New Destination'}
            </h2>
            <p className="text-sm text-slate-700 mt-1">Fill out the details for this destination.</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-md"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : (isEditMode ? 'Update Destination' : 'Create Destination')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Destination Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="name"
                value={formData.name} 
                onChange={handleChange}
                placeholder="e.g., Kerala, Goa, Maldives..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all" 
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea 
                name="description"
                value={formData.description} 
                onChange={handleChange}
                placeholder="Brief description about the destination..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none min-h-[120px] resize-y transition-all"
              ></textarea>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Favorable Months */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Best Time to Visit (Favorable Months)</label>
            <div className="flex flex-wrap gap-2">
              {MONTHS.map(month => {
                const isSelected = formData.favorableMonths.includes(month.value);
                return (
                  <button
                    key={month.value}
                    type="button"
                    onClick={() => toggleMonth(month.value)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all border ${
                      isSelected 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {month.label}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Destination Image</label>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-full max-w-sm aspect-video bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden flex flex-col items-center justify-center relative group">
                {formData.image ? (
                  <>
                    <img 
                      src={getImageUrl(formData.image)} 
                      alt="Destination Preview" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 text-slate-800">
                    <ImageIcon className="mx-auto mb-2 opacity-50" size={48} />
                    <p className="text-sm">No image selected</p>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-5">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-all border border-slate-300 shadow-sm hover:shadow"
                >
                  <Upload size={18} /> 
                  {formData.image ? 'Change Image' : 'Upload Image'}
                </button>
                <div className="text-sm text-slate-700 space-y-1.5">
                  <p>Recommended resolution: 800x600 pixels or higher.</p>
                  <p>Accepted formats: JPG, PNG, WEBP.</p>
                  <p>Max file size: 5MB.</p>
                </div>
                {formData.image && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 break-all">
                    <span className="font-semibold text-slate-700">Current URL:</span> <br/> {formData.image}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DestinationEditor;
