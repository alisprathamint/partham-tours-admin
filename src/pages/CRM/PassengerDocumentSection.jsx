import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axios';
import {
  ChevronDown, Plus, Upload, X, FileText, Image, File,
  Trash2, Eye, Download, Loader2, CheckCircle, AlertCircle,
  User, Users, Baby, FolderOpen, RefreshCw
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────

const DOCUMENT_TYPES = [
  { value: 'AADHAAR', label: 'Aadhaar Card', icon: '🪪' },
  { value: 'PAN', label: 'PAN Card', icon: '💳' },
  { value: 'PASSPORT', label: 'Passport', icon: '📕' },
  { value: 'DRIVING_LICENCE', label: 'Driving Licence', icon: '🚗' },
  { value: 'VOTER_ID', label: 'Voter ID', icon: '🗳️' },
  { value: 'VISA', label: 'Visa', icon: '🛂' },
  { value: 'TRAVEL_INSURANCE', label: 'Travel Insurance', icon: '🛡️' },
  { value: 'BIRTH_CERTIFICATE', label: 'Birth Certificate', icon: '📋' },
  { value: 'OTHER', label: 'Other Document', icon: '📎' },
];

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const fmtSize = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
const getDocLabel = (type) => DOCUMENT_TYPES.find(d => d.value === type) || { label: type, icon: '📎' };

// ─── Preview Modal ────────────────────────────────────────────────────────────

const PreviewModal = ({ doc, onClose }) => {
  if (!doc) return null;
  const isImage = doc.mimeType?.startsWith('image/');
  const isPdf = doc.mimeType === 'application/pdf';
  const url = `${API_BASE}${doc.fileUrl}`;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">{getDocLabel(doc.documentType).icon}</span>
            <div>
              <p className="font-bold text-white text-sm">{doc.customDocumentName || getDocLabel(doc.documentType).label}</p>
              <p className="text-[10px] text-slate-400">{doc.originalFileName} · {fmtSize(doc.fileSize)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={url} download={doc.originalFileName} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all">
              <Download size={11} /> Download
            </a>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><X size={15} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-4">
          {isImage ? (
            <img src={url} alt={doc.originalFileName} className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
          ) : isPdf ? (
            <iframe src={url} title={doc.originalFileName} className="w-full min-h-[500px] h-full rounded-lg" />
          ) : (
            <div className="text-center space-y-3">
              <File size={40} className="mx-auto text-slate-400" />
              <p className="text-slate-600 font-semibold text-sm">Preview not available</p>
              <a href={url} download={doc.originalFileName} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all">
                <Download size={13} /> Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Inline Upload Form ───────────────────────────────────────────────────────

const InlineUploadForm = ({ leadId, passengerIndex, passengerLabel, onSuccess, onCancel }) => {
  const [docType, setDocType] = useState('');
  const [customName, setCustomName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const fileRef = useRef(null);
  const typeRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (typeRef.current && !typeRef.current.contains(e.target)) setTypeOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const validateFile = (f) => {
    if (!ALLOWED_TYPES.includes(f.type)) { setError('Only PDF, JPG, JPEG, PNG allowed.'); return false; }
    if (f.size > MAX_SIZE) { setError('Max file size is 10MB.'); return false; }
    setError(''); return true;
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && validateFile(f)) setFile(f);
  };

  const handleSubmit = async () => {
    if (!docType) { setError('Please select a document type.'); return; }
    if (docType === 'OTHER' && !customName.trim()) { setError('Please enter a document name.'); return; }
    if (!file) { setError('Please select a file.'); return; }

    setUploading(true); setError('');
    try {
      const form = new FormData();
      form.append('documentType', docType);
      form.append('passengerIndex', String(passengerIndex));
      form.append('passengerLabel', passengerLabel);
      if (docType === 'OTHER') form.append('customDocumentName', customName.trim());
      if (docNumber) form.append('docNumber', docNumber);
      if (expiryDate) form.append('expiryDate', expiryDate);
      form.append('file', file);

      await api.post(`/crm/leads/${leadId}/documents?folder=customer-documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const selectedType = DOCUMENT_TYPES.find(d => d.value === docType);
  const showExtra = ['PASSPORT', 'VISA', 'DRIVING_LICENCE'].includes(docType);

  return (
    <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
      <p className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
        <Upload size={10} /> Add Document for {passengerLabel}
      </p>

      {/* Document Type Dropdown */}
      <div ref={typeRef} className="relative">
        <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Document Type *</label>
        <button
          type="button"
          onClick={() => setTypeOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white hover:border-blue-400 transition-all"
        >
          <span className={docType ? 'text-slate-900' : 'text-slate-400'}>
            {docType ? `${selectedType?.icon} ${selectedType?.label}` : 'Select document type...'}
          </span>
          <ChevronDown size={13} className={`text-slate-400 transition-transform ${typeOpen ? 'rotate-180' : ''}`} />
        </button>
        {typeOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto">
            {DOCUMENT_TYPES.map(dt => (
              <button
                key={dt.value}
                type="button"
                onClick={() => { setDocType(dt.value); setTypeOpen(false); setError(''); }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-xs font-semibold hover:bg-blue-50 transition-colors ${docType === dt.value ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
              >
                <span>{dt.icon}</span><span>{dt.label}</span>
                {docType === dt.value && <CheckCircle size={12} className="ml-auto text-blue-600 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom name for OTHER */}
      {docType === 'OTHER' && (
        <div>
          <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Document Name *</label>
          <input
            type="text"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            placeholder="e.g. Marriage Certificate, NOC..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      )}

      {/* Extra fields for travel docs */}
      {showExtra && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Doc Number</label>
            <input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="e.g. A1234567" className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Expiry Date</label>
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500 transition-all" />
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragging ? 'border-blue-500 bg-blue-50 scale-[1.01]'
          : file ? 'border-emerald-400 bg-emerald-50'
          : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40'
        }`}
      >
        {file ? (
          <>
            <div className="flex items-center gap-1.5 text-emerald-600 mb-0.5">
              <CheckCircle size={14} />
              <span className="text-[11px] font-bold">File selected</span>
            </div>
            <p className="text-[10px] text-slate-600 truncate max-w-[220px] font-medium">{file.name}</p>
            <p className="text-[9px] text-slate-400">{fmtSize(file.size)}</p>
            <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }} className="absolute top-1.5 right-1.5 p-0.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"><X size={11} /></button>
          </>
        ) : (
          <>
            <Upload size={16} className={`mb-1 ${dragging ? 'text-blue-500' : 'text-slate-400'}`} />
            <p className="text-[10px] font-semibold text-slate-500">{dragging ? 'Drop here' : 'Drag & drop or click to browse'}</p>
            <p className="text-[9px] text-slate-400">PDF · JPG · PNG · Max 10MB</p>
          </>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { const f = e.target.files[0]; if (f && validateFile(f)) setFile(f); }} />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[10px] font-semibold">
          <AlertCircle size={11} className="shrink-0" />{error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 border border-slate-300 text-slate-600 font-bold text-[11px] rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
        <button type="button" onClick={handleSubmit} disabled={uploading} className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all disabled:opacity-60 flex items-center justify-center gap-1.5">
          {uploading ? <><Loader2 size={11} className="animate-spin" /> Uploading...</> : <><Upload size={11} /> Upload</>}
        </button>
      </div>
    </div>
  );
};

// ─── Single Document Row ──────────────────────────────────────────────────────

const DocRow = ({ doc, onPreview, onDelete, deleting }) => {
  const info = getDocLabel(doc.documentType);
  const url = `${API_BASE}${doc.fileUrl}`;
  const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
  const soonExpiry = doc.expiryDate && !isExpired && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group ${deleting ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-base shrink-0">{info.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-extrabold text-slate-800 truncate">{doc.customDocumentName || info.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">{doc.originalFileName}</span>
          <span className="text-[9px] text-slate-400">·</span>
          <span className="text-[9px] text-slate-400">{fmtSize(doc.fileSize)}</span>
          {doc.docNumber && <><span className="text-[9px] text-slate-400">·</span><span className="text-[9px] font-bold text-slate-500">{doc.docNumber}</span></>}
          {isExpired && <span className="text-[8px] font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">EXPIRED</span>}
          {soonExpiry && <span className="text-[8px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">EXPIRING</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onPreview(doc)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Preview"><Eye size={13} /></button>
        <a href={url} download={doc.originalFileName} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors" title="Download"><Download size={13} /></a>
        <button onClick={() => onDelete(doc)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete">{deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}</button>
      </div>
    </div>
  );
};

// ─── Passenger Folder Card ────────────────────────────────────────────────────

const PassengerFolder = ({ leadId, index, label, isChild, documents, loading, onRefresh }) => {
  const [expanded, setExpanded] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const myDocs = documents.filter(d => d.passengerIndex === index);
  const docCount = myDocs.length;

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.customDocumentName || getDocLabel(doc.documentType).label}"?`)) return;
    setDeletingId(doc.id);
    try {
      await api.delete(`/crm/documents/${doc.id}`);
      onRefresh();
    } catch {
      alert('Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const folderColor = isChild
    ? { border: 'border-violet-200', header: 'bg-violet-50', tag: 'bg-violet-100 text-violet-700', icon: 'text-violet-500', btn: 'bg-violet-600 hover:bg-violet-700' }
    : { border: 'border-blue-200', header: 'bg-blue-50', tag: 'bg-blue-100 text-blue-700', icon: 'text-blue-500', btn: 'bg-blue-600 hover:bg-blue-700' };

  return (
    <>
      <div className={`rounded-xl border ${folderColor.border} overflow-hidden transition-all shadow-sm`}>
        {/* Folder Header */}
        <div
          className={`${folderColor.header} px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:brightness-95 transition-all`}
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isChild ? 'bg-violet-100' : 'bg-blue-100'}`}>
              {isChild ? <Baby size={16} className={folderColor.icon} /> : <User size={16} className={folderColor.icon} />}
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-800">{label}</p>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${isChild ? 'text-violet-600' : 'text-blue-600'}`}>
                {isChild ? 'Child' : 'Adult'} · {docCount} document{docCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {docCount > 0 && (
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${folderColor.tag}`}>{docCount}</span>
            )}
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Folder Content */}
        {expanded && (
          <div className="p-3 bg-white space-y-2">
            {/* Uploaded Documents List */}
            {loading ? (
              <div className="flex items-center justify-center py-4 text-slate-400 text-xs font-medium gap-2">
                <Loader2 size={14} className="animate-spin" /> Loading...
              </div>
            ) : myDocs.length === 0 ? (
              <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <FolderOpen size={18} className="mx-auto text-slate-300 mb-1" />
                <p className="text-[10px] text-slate-400 font-medium">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {myDocs.map(doc => (
                  <DocRow
                    key={doc.id}
                    doc={doc}
                    onPreview={setPreviewDoc}
                    onDelete={handleDelete}
                    deleting={deletingId === doc.id}
                  />
                ))}
              </div>
            )}

            {/* Upload Form (inline) */}
            {showUpload && (
              <InlineUploadForm
                leadId={leadId}
                passengerIndex={index}
                passengerLabel={label}
                onSuccess={() => { setShowUpload(false); onRefresh(); }}
                onCancel={() => setShowUpload(false)}
              />
            )}

            {/* Add Document Button */}
            {!showUpload && (
              <button
                onClick={() => setShowUpload(true)}
                className={`w-full flex items-center justify-center gap-2 py-2 mt-1 ${folderColor.btn} text-white text-[11px] font-bold rounded-lg transition-all shadow-sm`}
              >
                <Plus size={12} /> Add Document
              </button>
            )}
          </div>
        )}
      </div>

      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </>
  );
};

// ─── Main Export: PassengerDocumentSection ────────────────────────────────────

const PassengerDocumentSection = ({ leadId, paxStr, passengerDetails }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Parse pax string to get adults + children counts
  const parsePax = () => {
    if (!paxStr) return { adults: 1, children: 0 };
    const s = String(paxStr);
    // Try to match "2 Adults, 1 Children"
    const adultMatch = s.match(/(\d+)\s*Adult/i);
    const childMatch = s.match(/(\d+)\s*Child/i);
    if (adultMatch || childMatch) {
      return {
        adults: adultMatch ? parseInt(adultMatch[1]) : 0,
        children: childMatch ? parseInt(childMatch[1]) : 0,
      };
    }
    // Just a number — all adults
    const n = parseInt(s) || 1;
    return { adults: n, children: 0 };
  };

  const { adults, children } = parsePax();
  const total = adults + children;

  // Build passenger list: adults first, then children
  const passengers = [
    ...Array.from({ length: adults }, (_, i) => {
      const pDetail = (passengerDetails || []).find(p => p.index === i);
      const namePart = pDetail?.name || `Passenger ${i + 1}`;
      const agePart = pDetail?.age ? `, ${pDetail.age} yrs` : '';
      const genderPart = pDetail?.gender ? ` (${pDetail.gender})` : '';
      return {
        index: i,
        label: `${namePart}${agePart}${genderPart} ${adults > 1 && !pDetail?.name ? `(Adult ${i + 1})` : ''}`,
        isChild: false,
      };
    }),
    ...Array.from({ length: children }, (_, i) => {
      const idx = adults + i;
      const pDetail = (passengerDetails || []).find(p => p.index === idx);
      const namePart = pDetail?.name || `Child ${i + 1}`;
      const agePart = pDetail?.age ? `, ${pDetail.age} yrs` : '';
      const genderPart = pDetail?.gender ? ` (${pDetail.gender})` : '';
      return {
        index: idx,
        label: `${namePart}${agePart}${genderPart}`,
        isChild: true,
      };
    }),
  ];

  const fetchDocs = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const res = await api.get(`/crm/leads/${leadId}/documents`);
      if (res.data.success) {
        // Only show docs that have a passengerIndex (from this section)
        setDocuments((res.data.data || []).filter(d => d.passengerIndex !== null && d.passengerIndex !== undefined));
      }
    } catch (e) {
      console.error('Error fetching passenger docs:', e);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  if (total === 0) return null;

  return (
    <div className="mt-6 pt-5 border-t border-slate-200">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Users size={14} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Traveler Document Folders
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              {adults} Adult{adults !== 1 ? 's' : ''}{children > 0 ? ` + ${children} Child${children !== 1 ? 'ren' : ''}` : ''} · {total} folders auto-created
            </p>
          </div>
        </div>
        <button
          onClick={fetchDocs}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg bg-white transition-all"
        >
          <RefreshCw size={10} /> Refresh
        </button>
      </div>

      {/* Passenger Folder Grid */}
      <div className="flex flex-col gap-4">
        {passengers.map(p => (
          <PassengerFolder
            key={p.index}
            leadId={leadId}
            index={p.index}
            label={p.label}
            isChild={p.isChild}
            documents={documents}
            loading={loading}
            onRefresh={fetchDocs}
          />
        ))}
      </div>
    </div>
  );
};

export default PassengerDocumentSection;
