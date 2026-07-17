import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Package as PackageIcon, CheckCircle2, IndianRupee, Users, Calendar, MapPin, Printer, MessageCircle, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const SendQuotationModal = ({ isOpen, onClose, query, onStatusUpdate }) => {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280);
  };
  
  // Customization Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    travelDate: '',
    pax: '2 Adults',
    sellingPrice: '',
    discount: '0',
    validity: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 days
  });

  const printRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
      // Pre-fill form from query
      if (query) {
        setFormData(prev => ({
          ...prev,
          customerName: query.name || '',
          customerPhone: query.phone || '',
          travelDate: query.travelDate ? new Date(query.travelDate).toISOString().split('T')[0] : '',
          pax: query.pax ? `${query.pax} Adults` : '2 Adults',
        }));
      }
    } else {
      setSelectedPkg(null); // Reset when closed
    }
  }, [isOpen, query]);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/packages');
      const data = response.data;
      if (data.success) {
        setPackages(data.packages);
      }
    } catch (err) {
      console.error('Error fetching packages', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackageSelect = (pkgId) => {
    const pkg = packages.find(p => p.id.toString() === pkgId.toString());
    setSelectedPkg(pkg);
    if (pkg) {
      setFormData(prev => ({
        ...prev,
        sellingPrice: pkg.price ? pkg.price.toString() : '0'
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const finalPrice = Math.max(0, parseInt(formData.sellingPrice || '0') - parseInt(formData.discount || '0'));

  const getPdfUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    const origin = window.location.origin;
    let frontendOrigin = origin;
    if (origin.includes('5173')) {
      frontendOrigin = origin.replace('5173', '3000');
    } else if (origin.includes('5174')) {
      frontendOrigin = origin.replace('5174', '3000');
    } else if (origin.includes('5175')) {
      frontendOrigin = origin.replace('5175', '3000');
    } else if (origin.includes('admin.')) {
      frontendOrigin = origin.replace('admin.', '');
    }
    return `${frontendOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
  };
  const handlePrint = async () => {
    if (query && query.id && user) {
      try {
        await api.put(`/crm/leads/${query.id}`, { status: 'PROPOSAL_SENT', priceRange: finalPrice.toString() });
        if (selectedPkg) {
          const noteContent = `[Quotation Details] Sent Package: ${selectedPkg.name} | Price: ₹${finalPrice.toLocaleString('en-IN')} | Duration: ${selectedPkg.duration} | Travel Date: ${formData.travelDate}`;
          await api.post(`/crm/leads/${query.id}/notes`, { content: noteContent });
        }
        if (onStatusUpdate) {
          onStatusUpdate(query.id, 'PROPOSAL_SENT');
        }
      } catch (err) {
        console.error('Auto status update failed', err);
      }
    }
    
    if (selectedPkg?.pdfUrl) {
      window.open(getPdfUrl(selectedPkg.pdfUrl), '_blank');
    } else {
      alert('No itinerary PDF available for this package. Please upload one in the Packages section.');
    }
  };

  const handleWhatsApp = async () => {
    if (query && query.id && user) {
      try {
        await api.put(`/crm/leads/${query.id}`, { status: 'PROPOSAL_SENT', priceRange: finalPrice.toString() });
        if (selectedPkg) {
          const noteContent = `[Quotation Details] Sent Package: ${selectedPkg.name} | Price: ₹${finalPrice.toLocaleString('en-IN')} | Duration: ${selectedPkg.duration} | Travel Date: ${formData.travelDate}`;
          await api.post(`/crm/leads/${query.id}/notes`, { content: noteContent });
        }
        if (onStatusUpdate) {
          onStatusUpdate(query.id, 'PROPOSAL_SENT');
        }
      } catch (err) {
        console.error('Auto status update failed', err);
      }
    }

    const phone = formData.customerPhone.replace(/[^0-9]/g, '');
    
    let text = `Hello ${formData.customerName},\n\nGreetings from Pratham Tours!\nHere are the quotation details for your upcoming trip to ${selectedPkg?.destination || 'your destination'}.\n\n*Total Price:* ₹${finalPrice.toLocaleString('en-IN')}\n*Travel Date:* ${formData.travelDate}\n`;
    
    if (selectedPkg?.pdfUrl) {
      text += `\nYou can view your detailed day-wise itinerary PDF here:\n${getPdfUrl(selectedPkg.pdfUrl)}\n`;
    } else {
      text += `\nPlease review the attached document for more details.\n`;
    }
    
    text += `\nThank you!`;
    
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
  };
  if (!isOpen) return null;

  if (!isOpen) return null;

  // The Coming Soon screen has been removed to enable the actual Quotation Builder
  // PRESERVED ORIGINAL CODE (Currently Unreachable)
  // ==========================================
  const modalContent = (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
      <div className={`bg-slate-50 w-full h-full md:w-[85vw] md:max-w-5xl md:h-[80vh] md:max-h-[750px] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-300 ${isClosing ? 'animate-slide-out-left' : 'animate-slide-in-left'}`}>
        
        {/* Modal Header */}
        <div className="px-5 py-3 bg-white border-b border-slate-200 flex justify-between items-center z-10 flex-shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <PackageIcon size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">Send Proposal</h2>
              <p className="text-[11px] text-slate-700">Select a master package and generate PDF.</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 text-slate-800 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body (Split Screen) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Edit Form */}
          <div className="w-[320px] bg-white border-r border-slate-200 overflow-y-auto p-5 flex flex-col space-y-5 print:hidden">
            
            {/* Step 1: Select Master Package */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">1. Select Package</label>
              {isLoading ? (
                <div className="p-3 border rounded-lg bg-slate-50 text-slate-700 text-xs">Loading packages...</div>
              ) : (
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800 text-sm transition-shadow hover:shadow-sm"
                  onChange={(e) => handlePackageSelect(e.target.value)}
                  value={selectedPkg?.id || ''}
                >
                  <option value="" disabled>-- Select a Package --</option>
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.duration}) - ₹{p.price}</option>
                  ))}
                </select>
              )}
            </div>

            {selectedPkg && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-5 border-t pt-5 border-slate-100">
                {/* Step 2: Customization */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">2. Customize</label>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Customer Name</label>
                      <input 
                        type="text" 
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 text-xs font-medium" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Travel Date</label>
                        <input 
                          type="date" 
                          name="travelDate"
                          value={formData.travelDate}
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 text-xs font-medium" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Total Pax</label>
                        <input 
                          type="text" 
                          name="pax"
                          value={formData.pax}
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 text-xs font-medium" 
                        />
                      </div>
                    </div>

                    <div className="h-px bg-slate-100 my-2"></div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Selling Price (₹)</label>
                        <input 
                          type="number" 
                          name="sellingPrice"
                          value={formData.sellingPrice}
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-md focus:ring-2 focus:ring-blue-500 text-xs" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Discount (₹)</label>
                        <input 
                          type="number" 
                          name="discount"
                          value={formData.discount}
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-md focus:ring-2 focus:ring-amber-500 text-xs" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Action */}
                <div className="pt-5 border-t border-slate-100 mt-auto">
                  <div className="bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-200 mb-3 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-800">Final Amount</span>
                    <span className="text-lg font-black text-emerald-600">₹ {finalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handlePrint}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-md shadow-slate-200 transition-all flex items-center justify-center gap-1.5 group"
                    >
                      <Printer size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                      PDF / Print
                    </button>
                    <button 
                      onClick={handleWhatsApp}
                      className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold text-xs rounded-lg shadow-md shadow-green-100 transition-all flex items-center justify-center gap-1.5 group"
                    >
                      <MessageCircle size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {!selectedPkg && !isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 mt-8">
                <PackageIcon size={36} className="text-slate-300 mb-3" />
                <p className="text-xs font-medium">Select a package from above<br/>to start editing.</p>
              </div>
            )}
          </div>

          {/* Right Panel: Live PDF Preview */}
          <div className="flex-1 bg-slate-200/60 overflow-hidden flex justify-center p-6 relative">
            {!selectedPkg ? (
              <div className="flex flex-col items-center justify-center text-slate-800 h-full">
                <div className="w-24 h-32 bg-white rounded shadow-sm border border-slate-200 opacity-50 flex items-center justify-center">
                  <FileTextIcon />
                </div>
                <p className="mt-3 text-sm font-medium">Select a package to view its Itinerary</p>
              </div>
            ) : selectedPkg.pdfUrl ? (
              <div className="w-full h-full max-w-4xl bg-white shadow-xl rounded-xl border border-slate-300 overflow-hidden flex flex-col">
                 <div className="bg-slate-800 text-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wider flex justify-between items-center">
                   <span>Itinerary Preview</span>
                   <span className="text-slate-400 font-normal">{selectedPkg.name}</span>
                 </div>
                 <iframe 
                   src={getPdfUrl(selectedPkg.pdfUrl)} 
                   className="w-full h-full flex-1"
                   title="Package Itinerary PDF"
                 />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-800 h-full">
                <div className="w-24 h-32 bg-white rounded shadow-sm border border-slate-200 opacity-50 flex items-center justify-center">
                  <FileTextIcon />
                </div>
                <p className="mt-3 text-sm font-medium">No PDF uploaded for this package</p>
                <p className="text-xs text-slate-500 mt-1">Please add a PDF URL in the Packages section.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

const FileTextIcon = () => (
  <FileText size={48} strokeWidth={1.5} />
);

export default SendQuotationModal;
