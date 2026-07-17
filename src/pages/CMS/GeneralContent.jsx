import React, { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Upload, Plus, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import { getImageUrl } from '../../utils/imageHelper';

const GeneralContent = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    // Home
    heroSlides: '[]',
    heroViewPackagesBtn: '',
    heroContactUsBtn: '',
    whyChooseUsTitle: '',
    whyChooseUsSubtitle: '',
    whyChooseUsFeatures: '[]',
    
    // About
    aboutUsTitle: '',
    aboutUsSubtitle: '',
    ourStoryTitle: '',
    ourStorySubtitle: '',
    ourStoryText1: '',
    ourStoryText2: '',
    ourStoryText3: '',
    ourStoryImage: '',
    aboutWhyChooseTitle: '',
    aboutWhyChooseSubtitle: '',
    aboutWhyChooseFeatures: '[]',
    ourServicesTitle: '',
    ourServicesSubtitle: '',
    ourServicesFeatures: '[]',
    ourMissionTitle: '',
    ourMissionSubtitle: '',
    ourMissionText1: '',
    ourMissionText2: '',
    ourMissionImage: '',
    ourValuesTitle: '',
    ourValuesSubtitle: '',
    ourValuesFeatures: '[]',
    aboutStats: '[]',

    // Global / Branding
    mainLogo: ''
  });

  const fileInputRef = useRef(null);
  const [uploadingField, setUploadingField] = useState(null);

  useEffect(() => {
    api.get('/settings')
      .then(res => res.data)
      .then(data => {
        if (data.success && data.data) {
          setFormData(prev => ({ ...prev, ...data.data }));
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching settings:', err);
        setIsLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const parseJsonSafe = (str, fallback = []) => {
    try {
      return JSON.parse(str || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    const arr = parseJsonSafe(formData[arrayName]);
    if (arr[index]) {
      arr[index][field] = value;
      setFormData(prev => ({ ...prev, [arrayName]: JSON.stringify(arr) }));
    }
  };

  const addArrayItem = (arrayName, emptyItem) => {
    const arr = parseJsonSafe(formData[arrayName]);
    arr.push(emptyItem);
    setFormData(prev => ({ ...prev, [arrayName]: JSON.stringify(arr) }));
  };

  const removeArrayItem = (arrayName, index) => {
    const arr = parseJsonSafe(formData[arrayName]);
    arr.splice(index, 1);
    setFormData(prev => ({ ...prev, [arrayName]: JSON.stringify(arr) }));
  };

  const triggerImageUpload = (fieldName, index = null, arrayName = null) => {
    setUploadingField({ fieldName, index, arrayName });
    fileInputRef.current.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    try {
      let folderName = 'general';
      if (uploadingField?.fieldName) {
        const fieldLower = uploadingField.fieldName.toLowerCase();
        if (fieldLower.includes('logo') || fieldLower.includes('favicon')) {
          folderName = 'logos';
        } else if (fieldLower.includes('about')) {
          folderName = 'about';
        }
      }
      const res = await api.post(`/upload?folder=${folderName}`, data);
      const result = res.data;
      
      if (result.success && result.file.url) {
        if (uploadingField.arrayName) {
           handleArrayChange(uploadingField.arrayName, uploadingField.index, uploadingField.fieldName, result.file.url);
        } else {
           setFormData(prev => ({ ...prev, [uploadingField.fieldName]: result.file.url }));
        }
      } else {
        alert('Image upload failed');
      }
    } catch (error) {
      console.error(error);
      alert('Error uploading image');
    }
    
    // Reset file input
    e.target.value = '';
    setUploadingField(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const response = await api.post('/settings', formData);
      const data = response.data;
      if (data.success) {
        alert('Content saved successfully to Database!');
      } else {
        alert('Failed to save content.');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Error connecting to server.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-700">Loading settings...</div>;
  }

  const heroSlides = parseJsonSafe(formData.heroSlides);
  const whyChooseUsFeatures = parseJsonSafe(formData.whyChooseUsFeatures);
  const aboutWhyChooseFeatures = parseJsonSafe(formData.aboutWhyChooseFeatures);
  const ourServicesFeatures = parseJsonSafe(formData.ourServicesFeatures);
  const ourValuesFeatures = parseJsonSafe(formData.ourValuesFeatures);
  const aboutStats = parseJsonSafe(formData.aboutStats);

  return (
    <div className="space-y-6">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Website Content Management</h2>
          <p className="text-sm text-slate-700 mt-1">Manage texts and images for your main website pages.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('home')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'home'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-700 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Home Page
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'about'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-700 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            About Us Page
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'global'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-700 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Global Settings
          </button>
        </nav>
      </div>

      {activeTab === 'global' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Website Branding</h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Main Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-40 h-auto p-4 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                  {formData.mainLogo ? (
                    <img src={getImageUrl(formData.mainLogo)} alt="Logo" className="max-h-20 object-contain" />
                  ) : (
                    <ImageIcon className="text-slate-800" size={32} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <input 
                      type="text" 
                      value={formData.mainLogo} 
                      readOnly 
                      placeholder="No logo uploaded"
                      className="flex-1 px-4 py-2 border rounded-lg bg-slate-50 text-slate-700" 
                    />
                    <button 
                      type="button" 
                      onClick={() => triggerImageUpload('mainLogo')} 
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                    >
                      <Upload size={18} /> Upload Logo
                    </button>
                  </div>
                  <p className="text-xs text-slate-700">Recommended size: 200x50 pixels. PNG or SVG format with transparent background.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Hero Section Slides</h3>
              <button onClick={() => addArrayItem('heroSlides', { image: '', title: '', subtitle: '' })} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus size={16} /> Add Slide
              </button>
            </div>
            <div className="p-6 space-y-6">
              {heroSlides.map((slide, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg relative">
                   <button onClick={() => removeArrayItem('heroSlides', index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Slide {index + 1} Title</label>
                        <input type="text" value={slide.title} onChange={e => handleArrayChange('heroSlides', index, 'title', e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Slide {index + 1} Image</label>
                        <div className="flex items-center gap-2">
                           <input type="text" value={slide.image} readOnly className="w-full px-4 py-2 border rounded-lg bg-slate-50 text-slate-700" />
                           <button type="button" onClick={() => triggerImageUpload('image', index, 'heroSlides')} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"><Upload size={20}/></button>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Slide {index + 1} Subtitle</label>
                        <textarea value={slide.subtitle} onChange={e => handleArrayChange('heroSlides', index, 'subtitle', e.target.value)} className="w-full px-4 py-2 border rounded-lg resize-none" rows="2"></textarea>
                      </div>
                   </div>
                </div>
              ))}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">View Packages Button Text</label>
                  <input type="text" name="heroViewPackagesBtn" value={formData.heroViewPackagesBtn} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Us Button Text</label>
                  <input type="text" name="heroContactUsBtn" value={formData.heroContactUsBtn} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Why Choose Us Section</h3>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title (HTML allowed)</label>
                  <input type="text" name="whyChooseUsTitle" value={formData.whyChooseUsTitle} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
                  <textarea name="whyChooseUsSubtitle" value={formData.whyChooseUsSubtitle} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg resize-none" rows="2"></textarea>
               </div>
               
               <div className="pt-4 flex justify-between items-center">
                 <h4 className="font-medium text-slate-700">Features</h4>
                 <button onClick={() => addArrayItem('whyChooseUsFeatures', { icon: 'fas fa-star', title: '', description: '' })} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <Plus size={16} /> Add Feature
                 </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {whyChooseUsFeatures.map((feature, index) => (
                   <div key={index} className="p-4 border border-slate-200 rounded-lg relative">
                     <button onClick={() => removeArrayItem('whyChooseUsFeatures', index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                     <div className="space-y-3">
                       <div>
                         <label className="block text-xs font-medium text-slate-700">Icon Class (e.g. fas fa-headset)</label>
                         <input type="text" value={feature.icon} onChange={e => handleArrayChange('whyChooseUsFeatures', index, 'icon', e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm" />
                       </div>
                       <div>
                         <label className="block text-xs font-medium text-slate-700">Title</label>
                         <input type="text" value={feature.title} onChange={e => handleArrayChange('whyChooseUsFeatures', index, 'title', e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm" />
                       </div>
                       <div>
                         <label className="block text-xs font-medium text-slate-700">Description</label>
                         <textarea value={feature.description} onChange={e => handleArrayChange('whyChooseUsFeatures', index, 'description', e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm resize-none" rows="2"></textarea>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">About Us Header</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input type="text" name="aboutUsTitle" value={formData.aboutUsTitle} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
                  <input type="text" name="aboutUsSubtitle" value={formData.aboutUsSubtitle} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
               </div>
            </div>
          </div>

          {/* Our Story */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Our Story</h3>
            </div>
            <div className="p-6 space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input type="text" name="ourStoryTitle" value={formData.ourStoryTitle} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
                    <input type="text" name="ourStorySubtitle" value={formData.ourStorySubtitle} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                 </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paragraph 1</label>
                  <textarea name="ourStoryText1" value={formData.ourStoryText1} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg resize-none" rows="2"></textarea>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paragraph 2</label>
                  <textarea name="ourStoryText2" value={formData.ourStoryText2} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg resize-none" rows="2"></textarea>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paragraph 3</label>
                  <textarea name="ourStoryText3" value={formData.ourStoryText3} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg resize-none" rows="2"></textarea>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Story Image</label>
                  <div className="flex items-center gap-2">
                     <input type="text" value={formData.ourStoryImage} readOnly className="w-full px-4 py-2 border rounded-lg bg-slate-50 text-slate-700" />
                     <button type="button" onClick={() => triggerImageUpload('ourStoryImage')} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"><Upload size={20}/></button>
                  </div>
               </div>
            </div>
          </div>

          {/* Our Mission */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Our Mission</h3>
            </div>
            <div className="p-6 space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input type="text" name="ourMissionTitle" value={formData.ourMissionTitle} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
                    <input type="text" name="ourMissionSubtitle" value={formData.ourMissionSubtitle} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                 </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paragraph 1</label>
                  <textarea name="ourMissionText1" value={formData.ourMissionText1} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg resize-none" rows="2"></textarea>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paragraph 2</label>
                  <textarea name="ourMissionText2" value={formData.ourMissionText2} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg resize-none" rows="2"></textarea>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mission Image</label>
                  <div className="flex items-center gap-2">
                     <input type="text" value={formData.ourMissionImage} readOnly className="w-full px-4 py-2 border rounded-lg bg-slate-50 text-slate-700" />
                     <button type="button" onClick={() => triggerImageUpload('ourMissionImage')} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"><Upload size={20}/></button>
                  </div>
               </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Stats</h3>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
               {aboutStats.map((stat, index) => (
                 <div key={index} className="p-3 border border-slate-200 rounded-lg">
                   <div className="space-y-2">
                     <div>
                       <label className="block text-xs font-medium text-slate-700">Number</label>
                       <input type="number" value={stat.end} onChange={e => handleArrayChange('aboutStats', index, 'end', parseInt(e.target.value))} className="w-full px-2 py-1 border rounded text-sm" />
                     </div>
                     <div>
                       <label className="block text-xs font-medium text-slate-700">Suffix</label>
                       <input type="text" value={stat.suffix} onChange={e => handleArrayChange('aboutStats', index, 'suffix', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                     </div>
                     <div>
                       <label className="block text-xs font-medium text-slate-700">Label</label>
                       <input type="text" value={stat.label} onChange={e => handleArrayChange('aboutStats', index, 'label', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default GeneralContent;
