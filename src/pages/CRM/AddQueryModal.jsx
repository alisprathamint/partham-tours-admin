import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import { X } from 'lucide-react';

const AddQueryModal = ({ isOpen, onClose, onSuccess, user }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    origin: '',
    destination: '',
    pax: '',
    travelDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        type: 'QUERY',
        status: 'IN_PROGRESS', // Default to IN_PROGRESS so it shows up in My Queries immediately
        assignedToId: user?.id,
        assignedTo: user?.name,
      };

      const res = await api.post('/crm/leads', payload);
      if (res.data.success) {
        onSuccess(res.data.data);
        onClose();
        setFormData({ name: '', phone: '', email: '', origin: '', destination: '', pax: '', travelDate: '' });
      } else {
        alert('Failed to add query');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while adding the query');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Add New Query</h2>
            <p className="text-sm text-slate-500 mt-0.5">Create a query manually</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Name *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Rahul Sharma" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number *</label>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. 9876543210" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email (Optional)</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. rahul@example.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Destination</label>
              <select 
                name="destination" 
                value={formData.destination} 
                onChange={handleChange} 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">Select Destination</option>
                <option value="Kerala">Kerala</option>
                <option value="Sikkim">Sikkim</option>
                <option value="North East">North East</option>
                <option value="Bhutan">Bhutan</option>
                <option value="Kashmir">Kashmir</option>
                <option value="Andaman">Andaman</option>
                <option value="Goa">Goa</option>
                <option value="Himachal">Himachal</option>
                <option value="Uttarakhand">Uttarakhand</option>
                <option disabled>──────────</option>
                <option value="Maldives">Maldives</option>
                <option value="Dubai">Dubai</option>
                <option value="Thailand">Thailand</option>
                <option value="Bali">Bali</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Europe">Europe</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Origin / Departure City</label>
              <input type="text" name="origin" value={formData.origin} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Mumbai" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Pax (No. of Travelers)</label>
              <input type="text" name="pax" value={formData.pax} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. 2 Adults, 1 Child" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Travel Date</label>
              <input type="date" name="travelDate" value={formData.travelDate} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70">
              {isSubmitting ? 'Saving...' : 'Add Query'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AddQueryModal;
