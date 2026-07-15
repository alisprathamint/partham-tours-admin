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

  const handlePrint = async () => {
    // Automation: Update status to PROPOSAL_SENT
    if (query && query.id && user) {
      try {
        await api.put(`/crm/leads/${query.id}`, { status: 'PROPOSAL_SENT' });
        if (onStatusUpdate) {
          onStatusUpdate(query.id, 'PROPOSAL_SENT');
        }
      } catch (err) {
        console.error('Auto status update failed', err);
      }
    }
    window.print();
  };

  const handleWhatsApp = async () => {
    // Automation: Update status to PROPOSAL_SENT
    if (query && query.id && user) {
      try {
        await api.put(`/crm/leads/${query.id}`, { status: 'PROPOSAL_SENT' });
        if (onStatusUpdate) {
          onStatusUpdate(query.id, 'PROPOSAL_SENT');
        }
      } catch (err) {
        console.error('Auto status update failed', err);
      }
    }

    const phone = formData.customerPhone.replace(/[^0-9]/g, '');
    const text = `Hello ${formData.customerName},\n\nGreetings from Pratham Tours!\nHere are the quotation details for your upcoming trip to ${selectedPkg?.destination || 'your destination'}.\n\n*Total Price:* ₹${finalPrice.toLocaleString('en-IN')}\n*Travel Date:* ${formData.travelDate}\n\nPlease review the PDF document. Thank you!`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
  };

  if (!isOpen) return null;

  if (!isOpen) return null;

  // The Coming Soon screen has been removed to enable the actual Quotation Builder
  // PRESERVED ORIGINAL CODE (Currently Unreachable)
  // ==========================================
  const modalContent = (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm print:hidden ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
      <div className={`bg-slate-50 w-full h-full md:w-[85vw] md:max-w-5xl md:h-[80vh] md:max-h-[750px] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-300 ${isClosing ? 'animate-slide-out-left' : 'animate-slide-in-left'}`}>
        
        {/* Modal Header */}
        <div className="px-5 py-3 bg-white border-b border-slate-200 flex justify-between items-center z-10 flex-shrink-0">
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
          <div className="w-[320px] bg-white border-r border-slate-200 overflow-y-auto p-5 flex flex-col space-y-5">
            
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
          <div className="flex-1 bg-slate-200/60 overflow-y-auto flex justify-center p-6 relative">
            {!selectedPkg ? (
              <div className="flex flex-col items-center justify-center text-slate-800 h-full">
                <div className="w-24 h-32 bg-white rounded shadow-sm border border-slate-200 opacity-50 flex items-center justify-center">
                  <FileTextIcon />
                </div>
                <p className="mt-3 text-sm font-medium">PDF Preview will appear here</p>
              </div>
            ) : (
              <div className="origin-top transform scale-[0.7] sm:scale-[0.8] xl:scale-[0.9] transition-transform">
                <div 
                  id="pdf-preview-container"
                  ref={printRef}
                  className="bg-white shadow-2xl w-[21cm] h-[29.7cm] p-10 flex flex-col relative shrink-0"
                >
                {/* Watermark/Background Decor (Optional) */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>

                {/* PDF Header */}
                <div className="flex justify-between items-start border-b-2 border-blue-600 pb-6 mb-8">
                  <div>
                    <h1 className="text-3xl font-black text-blue-700 tracking-tight">PRATHAM TOURS</h1>
                    <p className="text-sm text-slate-700 font-medium mt-1">Make your travel dream true</p>
                    <div className="text-[10px] text-slate-700 mt-2 space-y-0.5">
                      <p>123 Travel Square, Business District</p>
                      <p>Mumbai, Maharashtra 400001</p>
                      <p>+91 98765 43210 | info@prathamtours.com</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-widest">Quotation</h2>
                    <p className="text-xs text-slate-700 mt-1">Ref: PT-{Math.floor(1000 + Math.random() * 9000)}</p>
                    <p className="text-xs text-slate-700">Date: {new Date().toLocaleDateString('en-GB')}</p>
                    <p className="text-xs text-slate-700 font-bold mt-2 bg-amber-100 text-amber-800 inline-block px-2 py-0.5 rounded">
                      Valid Till: {new Date(formData.validity).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-8 grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-bold text-blue-600 uppercase mb-2 border-b border-blue-100 pb-1">Prepared For</h3>
                    <p className="font-bold text-slate-800 text-lg">{formData.customerName || 'Customer Name'}</p>
                    <p className="text-sm text-slate-800">{formData.customerPhone || '+91 XXXXX XXXXX'}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-blue-600 uppercase mb-2 border-b border-blue-100 pb-1">Trip Details</h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-slate-700">Destination:</span>
                      <span className="font-semibold text-slate-800">{selectedPkg.location || 'N/A'}</span>
                      <span className="text-slate-700">Travel Date:</span>
                      <span className="font-semibold text-slate-800">{formData.travelDate ? new Date(formData.travelDate).toLocaleDateString('en-GB') : 'TBD'}</span>
                      <span className="text-slate-700">Duration:</span>
                      <span className="font-semibold text-slate-800">{selectedPkg.duration || 'N/A'}</span>
                      <span className="text-slate-700">Passengers:</span>
                      <span className="font-semibold text-slate-800">{formData.pax}</span>
                    </div>
                  </div>
                </div>

                {/* Package Main Area */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{selectedPkg.name}</h3>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {selectedPkg.description || 'Enjoy a wonderful vacation with our carefully curated tour package featuring the best accommodations, guided tours, and unforgettable experiences.'}
                  </p>
                </div>

                {/* Inclusions (Mock Data for preview) */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-blue-600 uppercase mb-3 border-b border-blue-100 pb-1">Package Includes</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['Hotel Accommodation', 'Daily Breakfast', 'Airport Transfers', 'Sightseeing Tours', 'Local Guide', 'Taxes & Fees'].map((inc, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 size={14} className="text-emerald-500" /> {inc}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spacer to push pricing to bottom */}
                <div className="flex-1"></div>

                {/* Pricing Table */}
                <div className="border border-slate-300 rounded-lg overflow-hidden mb-8">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b border-slate-300">
                      <tr>
                        <th className="text-left py-3 px-4 font-bold text-slate-700">Description</th>
                        <th className="text-right py-3 px-4 font-bold text-slate-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-3 px-4 text-slate-800 font-medium">Package Cost ({formData.pax})</td>
                        <td className="py-3 px-4 text-right text-slate-800">₹ {parseInt(formData.sellingPrice || 0).toLocaleString('en-IN')}</td>
                      </tr>
                      {parseInt(formData.discount || 0) > 0 && (
                        <tr>
                          <td className="py-3 px-4 text-emerald-600 font-medium">Special Discount</td>
                          <td className="py-3 px-4 text-right text-emerald-600">- ₹ {parseInt(formData.discount || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      )}
                      <tr className="bg-slate-800 text-white text-lg">
                        <td className="py-4 px-4 font-bold">Total Amount Payable</td>
                        <td className="py-4 px-4 text-right font-black">₹ {finalPrice.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer Notes */}
                <div className="text-[10px] text-slate-700 border-t border-slate-200 pt-4 flex justify-between">
                  <div>
                    <p className="font-bold text-slate-700 mb-1">Terms & Conditions:</p>
                    <p>1. 50% advance payment required for confirmation.</p>
                    <p>2. Flight fares are subject to change until ticketed.</p>
                    <p>3. Standard cancellation policies apply.</p>
                  </div>
                  <div className="text-right flex flex-col justify-end">
                    <p className="font-bold text-blue-700">Pratham Tours</p>
                    <p>Authorized Signatory</p>
                  </div>
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS For Printing ONLY the PDF container */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          /* Make sure the modal doesn't block printing */
          .fixed.inset-0 {
            position: absolute !important;
            background: transparent !important;
          }
          #pdf-preview-container, #pdf-preview-container * {
            visibility: visible;
          }
          #pdf-preview-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            box-shadow: none !important;
            border: none !important;
            padding: 20mm !important; /* Adjust print margins */
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

const FileTextIcon = () => (
  <FileText size={48} strokeWidth={1.5} />
);

export default SendQuotationModal;
