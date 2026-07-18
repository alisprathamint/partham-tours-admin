import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axios';
import {
  Upload, FileText, Image, File, Trash2, Eye, Download, RefreshCw,
  Search, Filter, X, ChevronDown, CheckCircle, AlertCircle, Loader2,
  FolderOpen, Shield, Plane, MoreHorizontal, Plus, Clock
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const DOCUMENT_TYPES = [
  { value: 'AADHAAR', label: 'Aadhaar Card', category: 'IDENTITY', icon: '🪪' },
  { value: 'PAN', label: 'PAN Card', category: 'IDENTITY', icon: '💳' },
  { value: 'PASSPORT', label: 'Passport', category: 'TRAVEL', icon: '📕' },
  { value: 'DRIVING_LICENCE', label: 'Driving Licence', category: 'IDENTITY', icon: '🚗' },
  { value: 'VOTER_ID', label: 'Voter ID', category: 'IDENTITY', icon: '🗳️' },
  { value: 'VISA', label: 'Visa', category: 'TRAVEL', icon: '🛂' },
  { value: 'TRAVEL_INSURANCE', label: 'Travel Insurance', category: 'TRAVEL', icon: '🛡️' },
  { value: 'BIRTH_CERTIFICATE', label: 'Birth Certificate', category: 'OTHER', icon: '📋' },
  { value: 'OTHER', label: 'Other', category: 'OTHER', icon: '📎' },
];

const CATEGORIES = [
  { key: 'ALL', label: 'All Documents', icon: FolderOpen, color: 'blue' },
  { key: 'IDENTITY', label: 'Identity Documents', icon: Shield, color: 'violet' },
  { key: 'TRAVEL', label: 'Travel Documents', icon: Plane, color: 'emerald' },
  { key: 'OTHER', label: 'Other Documents', icon: File, color: 'amber' },
];

const CATEGORY_STYLES = {
  IDENTITY: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-800', icon: 'text-violet-500' },
  TRAVEL:   { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', icon: 'text-emerald-500' },
  OTHER:    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', icon: 'text-amber-500' },
};

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType) => {
  if (!mimeType) return <File size={20} />;
  if (mimeType.startsWith('image/')) return <Image size={20} />;
  if (mimeType === 'application/pdf') return <FileText size={20} />;
  return <File size={20} />;
};

const getDocTypeInfo = (type) => DOCUMENT_TYPES.find(d => d.value === type) || { label: type, icon: '📎' };

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// ─── Upload Modal ─────────────────────────────────────────────────────────────

const UploadModal = ({ isOpen, onClose, leadId, onSuccess, existingDoc = null }) => {
  const [documentType, setDocumentType] = useState('');
  const [customDocumentName, setCustomDocumentName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);
  const typeRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setDocumentType(existingDoc?.documentType || '');
      setCustomDocumentName(existingDoc?.customDocumentName || '');
      setDocNumber(existingDoc?.docNumber || '');
      setIssueDate(existingDoc?.issueDate ? existingDoc.issueDate.split('T')[0] : '');
      setExpiryDate(existingDoc?.expiryDate ? existingDoc.expiryDate.split('T')[0] : '');
      setFile(null);
      setError('');
      setUploading(false);
      setTypeOpen(false);
    }
  }, [isOpen, existingDoc]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (typeRef.current && !typeRef.current.contains(e.target)) setTypeOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const validateFile = (f) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Only PDF, JPG, JPEG, and PNG files are allowed.');
      return false;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError(`File too large. Maximum size is ${formatFileSize(MAX_SIZE_BYTES)}.`);
      return false;
    }
    setError('');
    return true;
  };

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && validateFile(dropped)) setFile(dropped);
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected && validateFile(selected)) setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentType) { setError('Please select a document type.'); return; }
    if (documentType === 'OTHER' && !customDocumentName.trim()) { setError('Please enter the document name.'); return; }
    if (!existingDoc && !file) { setError('Please select a file to upload.'); return; }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      if (documentType === 'OTHER') formData.append('customDocumentName', customDocumentName.trim());
      if (docNumber) formData.append('docNumber', docNumber);
      if (issueDate) formData.append('issueDate', issueDate);
      if (expiryDate) formData.append('expiryDate', expiryDate);
      if (file) formData.append('file', file);

      if (existingDoc) {
        await api.put(`/crm/documents/${existingDoc.id}?folder=customer-documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post(`/crm/leads/${leadId}/documents?folder=customer-documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const selectedTypeInfo = getDocTypeInfo(documentType);
  const showExtraFields = ['PASSPORT', 'VISA', 'DRIVING_LICENCE'].includes(documentType);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white shrink-0">
          <div>
            <h2 className="font-extrabold text-slate-800 text-base">
              {existingDoc ? 'Replace / Update Document' : 'Upload New Document'}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Supported formats: PDF, JPG, JPEG, PNG · Max 10MB
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Document Type Dropdown */}
            <div ref={typeRef} className="relative">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Document Type <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setTypeOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 bg-white hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              >
                <span className={documentType ? 'text-slate-900' : 'text-slate-400'}>
                  {documentType ? `${selectedTypeInfo.icon} ${selectedTypeInfo.label}` : 'Select document type...'}
                </span>
                <ChevronDown size={15} className={`text-slate-400 transition-transform ${typeOpen ? 'rotate-180' : ''}`} />
              </button>
              {typeOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {DOCUMENT_TYPES.map(dt => (
                    <button
                      key={dt.value}
                      type="button"
                      onClick={() => { setDocumentType(dt.value); setTypeOpen(false); setError(''); }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm font-semibold hover:bg-blue-50 transition-colors ${documentType === dt.value ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                    >
                      <span>{dt.icon}</span>
                      <span>{dt.label}</span>
                      {documentType === dt.value && <CheckCircle size={14} className="ml-auto text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Document Name (only for OTHER) */}
            {documentType === 'OTHER' && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Document Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customDocumentName}
                  onChange={e => setCustomDocumentName(e.target.value)}
                  placeholder="e.g. Marriage Certificate, NOC Letter..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            )}

            {/* Optional metadata fields for Travel documents */}
            {showExtraFields && (
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="col-span-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">Optional Details</p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Doc Number</label>
                  <input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="Number" className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Issue Date</label>
                  <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Expiry Date</label>
                  <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>
            )}

            {/* Drag & Drop Zone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {existingDoc ? 'New File (optional)' : 'Upload File'} {!existingDoc && <span className="text-red-500">*</span>}
              </label>
              <div
                ref={dropRef}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                    : file
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
              >
                {file ? (
                  <>
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                      <CheckCircle size={22} />
                      <span className="font-bold text-sm">File Selected</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 truncate max-w-[280px]">{file.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formatFileSize(file.size)} · {file.type}</p>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setFile(null); }}
                      className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload size={24} className={`mb-2 transition-colors ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
                    <p className="text-sm font-bold text-slate-600">
                      {isDragging ? 'Drop file here' : 'Drag & drop or click to browse'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, JPEG, PNG · Max 10MB</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileSelect} />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><Loader2 size={14} className="animate-spin" /> Uploading...</>
              ) : (
                <><Upload size={14} /> {existingDoc ? 'Update Document' : 'Upload Document'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Preview Modal ─────────────────────────────────────────────────────────────

const PreviewModal = ({ doc, onClose }) => {
  if (!doc) return null;
  const isImage = doc.mimeType?.startsWith('image/');
  const isPdf = doc.mimeType === 'application/pdf';
  const fileUrl = `${API_BASE}${doc.fileUrl}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xl">{getDocTypeInfo(doc.documentType).icon}</span>
            <div>
              <p className="font-bold text-white text-sm">{doc.customDocumentName || getDocTypeInfo(doc.documentType).label}</p>
              <p className="text-[10px] text-slate-400">{doc.originalFileName} · {formatFileSize(doc.fileSize)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              download={doc.originalFileName}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Download size={12} /> Download
            </a>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="overflow-auto flex-1 flex items-center justify-center bg-slate-100 p-4">
          {isImage ? (
            <img src={fileUrl} alt={doc.originalFileName} className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
          ) : isPdf ? (
            <iframe src={fileUrl} title={doc.originalFileName} className="w-full h-full min-h-[500px] rounded-lg" />
          ) : (
            <div className="text-center text-slate-600 space-y-3">
              <File size={48} className="mx-auto text-slate-400" />
              <p className="font-semibold">Preview not available for this file type.</p>
              <a href={fileUrl} download={doc.originalFileName} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
                <Download size={14} /> Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Document Card ─────────────────────────────────────────────────────────────

const DocumentCard = ({ doc, onPreview, onReplace, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const styles = CATEGORY_STYLES[doc.category] || CATEGORY_STYLES.OTHER;
  const typeInfo = getDocTypeInfo(doc.documentType);
  const isExpiringSoon = doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`relative group rounded-xl border ${styles.border} bg-white hover:shadow-md transition-all duration-200 overflow-hidden`}>
      {/* Top accent bar */}
      <div className={`h-1 w-full ${styles.bg.replace('50', '400').replace('bg-', 'bg-')}`} style={{ background: doc.category === 'IDENTITY' ? '#7c3aed' : doc.category === 'TRAVEL' ? '#059669' : '#d97706' }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`shrink-0 w-10 h-10 rounded-xl ${styles.bg} ${styles.border} border flex items-center justify-center text-xl`}>
              {typeInfo.icon}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-slate-800 text-sm leading-tight truncate">
                {doc.customDocumentName || typeInfo.label}
              </p>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{doc.originalFileName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${styles.badge}`}>
                  {typeInfo.label}
                </span>
                <span className="text-[10px] text-slate-400">{formatFileSize(doc.fileSize)}</span>
              </div>
            </div>
          </div>

          {/* 3-dot menu */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden">
                <button onClick={() => { onPreview(doc); setMenuOpen(false); }} className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                  <Eye size={13} className="text-blue-500" /> Preview
                </button>
                <a
                  href={`${API_BASE}${doc.fileUrl}`}
                  download={doc.originalFileName}
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors block"
                >
                  <Download size={13} className="text-emerald-500" /> Download
                </a>
                <button onClick={() => { onReplace(doc); setMenuOpen(false); }} className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                  <RefreshCw size={13} className="text-amber-500" /> Replace
                </button>
                <div className="border-t border-slate-100" />
                <button onClick={() => { onDelete(doc); setMenuOpen(false); }} className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
          {doc.docNumber && (
            <p className="text-[10px] text-slate-500 font-medium"><span className="font-bold text-slate-600">No:</span> {doc.docNumber}</p>
          )}
          {doc.expiryDate && (
            <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-500'}`}>
              <Clock size={10} />
              {isExpired ? '⚠️ Expired' : isExpiringSoon ? '⚠️ Expiring soon'  : 'Valid until'}: {new Date(doc.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
          <p className="text-[10px] text-slate-400">
            Uploaded {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onPreview(doc)}
            className="flex-1 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center gap-1.5 transition-all"
          >
            <Eye size={11} /> View
          </button>
          <a
            href={`${API_BASE}${doc.fileUrl}`}
            download={doc.originalFileName}
            className="flex-1 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center gap-1.5 transition-all"
          >
            <Download size={11} /> Download
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const CustomerDocumentManager = ({ leadId, customerName, customerId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [replaceDoc, setReplaceDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDocuments = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/crm/leads/${leadId}/documents`);
      if (res.data.success) setDocuments(res.data.data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.customDocumentName || getDocTypeInfo(doc.documentType).label}"? This action cannot be undone.`)) return;
    setDeletingId(doc.id);
    try {
      await api.delete(`/crm/documents/${doc.id}`);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter documents
  const filtered = documents.filter(doc => {
    const matchCategory = activeCategory === 'ALL' || doc.category === activeCategory;
    const matchSearch = !search.trim() || 
      (doc.customDocumentName || '').toLowerCase().includes(search.toLowerCase()) ||
      getDocTypeInfo(doc.documentType).label.toLowerCase().includes(search.toLowerCase()) ||
      doc.originalFileName.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Group by category for display
  const grouped = {
    IDENTITY: filtered.filter(d => d.category === 'IDENTITY'),
    TRAVEL: filtered.filter(d => d.category === 'TRAVEL'),
    OTHER: filtered.filter(d => d.category === 'OTHER'),
  };

  const categoryCount = {
    ALL: documents.length,
    IDENTITY: documents.filter(d => d.category === 'IDENTITY').length,
    TRAVEL: documents.filter(d => d.category === 'TRAVEL').length,
    OTHER: documents.filter(d => d.category === 'OTHER').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl shrink-0">
            📁
          </div>
          <div>
            <p className="font-extrabold text-lg leading-tight">{customerName}</p>
            <p className="text-slate-400 text-xs font-medium mt-0.5">
              ID: #{customerId} · <span className="text-emerald-400 font-bold">{documents.length} Document{documents.length !== 1 ? 's' : ''}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => { setReplaceDoc(null); setUploadModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-900/30 transition-all shrink-0"
        >
          <Plus size={16} /> Upload Document
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents by name or type..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0 flex-wrap">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={12} />
                {cat.label.split(' ')[0]}
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${isActive ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-500'}`}>
                  {categoryCount[cat.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 size={28} className="animate-spin text-blue-500 mb-3" />
          <p className="text-sm font-semibold">Loading documents...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
          <AlertCircle size={16} />
          {error}
          <button onClick={fetchDocuments} className="ml-auto text-xs underline hover:no-underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <FolderOpen size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-500 text-sm">
            {search || activeCategory !== 'ALL' ? 'No documents match your filter.' : 'No documents uploaded yet.'}
          </p>
          {!search && activeCategory === 'ALL' && (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              <Plus size={13} /> Upload First Document
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {(activeCategory === 'ALL' ? ['IDENTITY', 'TRAVEL', 'OTHER'] : [activeCategory]).map(catKey => {
            const catDocs = activeCategory === 'ALL' ? grouped[catKey] : filtered;
            if (catDocs.length === 0) return null;
            const catInfo = CATEGORIES.find(c => c.key === catKey);
            const styles = CATEGORY_STYLES[catKey];
            const CatIcon = catInfo.icon;
            return (
              <div key={catKey}>
                <div className={`flex items-center gap-2.5 mb-3 px-3 py-2 rounded-xl ${styles.bg} border ${styles.border} w-fit`}>
                  <CatIcon size={14} className={styles.icon} />
                  <span className={`text-xs font-extrabold uppercase tracking-wider ${styles.text}`}>{catInfo.label}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${styles.badge}`}>{catDocs.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catDocs.map(doc => (
                    <div key={doc.id} className={`relative transition-opacity ${deletingId === doc.id ? 'opacity-50 pointer-events-none' : ''}`}>
                      {deletingId === doc.id && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <Loader2 size={20} className="animate-spin text-red-500" />
                        </div>
                      )}
                      <DocumentCard
                        doc={doc}
                        onPreview={setPreviewDoc}
                        onReplace={(d) => { setReplaceDoc(d); setUploadModalOpen(true); }}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload / Replace Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => { setUploadModalOpen(false); setReplaceDoc(null); }}
        leadId={leadId}
        existingDoc={replaceDoc}
        onSuccess={fetchDocuments}
      />

      {/* Preview Modal */}
      {previewDoc && (
        <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
};

export default CustomerDocumentManager;
