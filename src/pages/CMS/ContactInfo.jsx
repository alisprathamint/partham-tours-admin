import React, { useState, useEffect } from 'react';
import { Save, Phone, Mail, MapPin, MessageCircle, Globe, Link } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ContactInfo = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    facebook: '',
    instagram: '',
    twitter: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setFormData(prev => ({ ...prev, ...data.data }));
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching contact info:', err);
        setIsLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Contact Info updated successfully!');
      } else {
        alert('Failed to update contact info');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500">Loading contact information...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Contact Information</h2>
        <p className="text-sm text-slate-500 mt-1">Update your business contact details and social media links. These will appear across the website.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Primary Contact Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">Primary Contact</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Phone size={16} className="text-slate-400" /> Phone Number
              </label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <MessageCircle size={16} className="text-green-500" /> WhatsApp Number
              </label>
              <input 
                type="text" 
                name="whatsapp"
                value={formData.whatsapp || ''}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">Used for WhatsApp chat widget.</p>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Mail size={16} className="text-slate-400" /> Email Address
              </label>
              <input 
                type="email" 
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="contact@prathamtours.com"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <MapPin size={16} className="text-slate-400" /> Physical Address
              </label>
              <textarea 
                name="address"
                rows="3"
                value={formData.address || ''}
                onChange={handleChange}
                placeholder="123, Travel Hub, City, State - Zip"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">Social Media Links</h3>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Globe size={16} className="text-blue-600" /> Facebook URL
              </label>
              <input 
                type="url" 
                name="facebook"
                value={formData.facebook || ''}
                onChange={handleChange}
                placeholder="https://facebook.com/prathamtours"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Globe size={16} className="text-pink-600" /> Instagram URL
              </label>
              <input 
                type="url" 
                name="instagram"
                value={formData.instagram || ''}
                onChange={handleChange}
                placeholder="https://instagram.com/prathamtours"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Globe size={16} className="text-blue-400" /> Twitter/X URL
              </label>
              <input 
                type="url" 
                name="twitter"
                value={formData.twitter || ''}
                onChange={handleChange}
                placeholder="https://twitter.com/prathamtours"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>{isSaving ? 'Saving...' : 'Save Contact Info'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactInfo;
