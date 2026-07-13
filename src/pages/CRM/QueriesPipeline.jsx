import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { MoreVertical, Calendar, Phone, MapPin, MessageCircle, FileText, Clock, IndianRupee, GripVertical } from 'lucide-react';
import SendQuotationModal from './SendQuotationModal';

const STAGES = [
  { id: 'NEW', label: 'New Query', color: 'bg-blue-500', headerBg: 'bg-blue-50', textColor: 'text-blue-700', border: 'border-blue-200' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-500', headerBg: 'bg-amber-50', textColor: 'text-amber-700', border: 'border-amber-200' },
  { id: 'PROPOSAL_SENT', label: 'Quotation Sent', color: 'bg-purple-500', headerBg: 'bg-purple-50', textColor: 'text-purple-700', border: 'border-purple-200' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-pink-500', headerBg: 'bg-pink-50', textColor: 'text-pink-700', border: 'border-pink-200' },
  { id: 'WON', label: 'Closed Won', color: 'bg-emerald-500', headerBg: 'bg-emerald-50', textColor: 'text-emerald-700', border: 'border-emerald-200' },
  { id: 'LOST', label: 'Closed Lost', color: 'bg-rose-500', headerBg: 'bg-rose-50', textColor: 'text-rose-700', border: 'border-rose-200' }
];

const QueriesPipeline = () => {
  const { token } = useAuth();
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [selectedQuotationQuery, setSelectedQuotationQuery] = useState(null);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [draggableCardId, setDraggableCardId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [destinations, setDestinations] = useState([]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isClosingEdit, setIsClosingEdit] = useState(false);
  const [editingQuery, setEditingQuery] = useState(null);

  const handleCloseEditModal = () => {
    setIsClosingEdit(true);
    setTimeout(() => {
      setIsClosingEdit(false);
      setIsEditModalOpen(false);
    }, 280);
  };

  const fetchQueries = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/crm/leads?type=QUERY', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setQueries(data.data);
      }
    } catch (err) {
      console.error('Error fetching queries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDestinations = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/destinations');
      const data = await response.json();
      if (data.success) {
        setDestinations(data.data?.destinations || []);
      }
    } catch (err) {
      console.error('Error fetching destinations:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQueries();
      fetchDestinations();
    }
  }, [token]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };
    if (openDropdownId !== null) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdownId]);

  const handleDragStart = (e, queryId) => {
    setDraggingId(queryId);
    e.dataTransfer.setData('queryId', queryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e) => {
    setDraggingId(null);
    setDragOverStage(null);
    setDraggableCardId(null);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverStage(null);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverStage(null);
    const queryId = e.dataTransfer.getData('queryId');
    if (!queryId) return;

    // Optimistically update UI
    setQueries(prev => prev.map(q => q.id === queryId ? { ...q, status: newStatus } : q));

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/crm/leads/${queryId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!data.success) {
        fetchQueries();
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      fetchQueries();
    }
  };

  const handleDeleteQuery = async (queryId) => {
    if (!window.confirm('Are you sure you want to delete this query? This action cannot be undone.')) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/crm/leads/${queryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setQueries(prev => prev.filter(q => q.id !== queryId));
      } else {
        alert('Failed to delete query');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting query');
    }
  };

  const handleAddNote = async (queryId, content) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/crm/leads/${queryId}/notes`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (data.success) {
        alert('Note added successfully!');
        fetchQueries();
      } else {
        alert('Failed to add note');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding note');
    }
  };

  const handleEditClick = (query) => {
    let formattedDate = '';
    if (query.travelDate) {
      formattedDate = new Date(query.travelDate).toISOString().split('T')[0];
    }
    setEditingQuery({ ...query, travelDate: formattedDate });
    setIsEditModalOpen(true);
  };

  const handleUpdateQuery = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/crm/leads/${editingQuery.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingQuery.name,
          phone: editingQuery.phone,
          email: editingQuery.email,
          travelDate: editingQuery.travelDate || null,
          pax: editingQuery.pax || null,
          numDays: editingQuery.numDays || null,
          destination: editingQuery.destination
        })
      });
      const data = await res.json();
      if (data.success) {
        handleCloseEditModal();
        fetchQueries();
      } else {
        alert('Failed to update query');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating query');
    }
  };

  const handleOpenQuotation = (query) => {
    setSelectedQuotationQuery(query);
    setIsQuotationModalOpen(true);
  };

  const handleCloseQuotation = () => {
    setIsQuotationModalOpen(false);
    setTimeout(() => setSelectedQuotationQuery(null), 300); // allow animation
  };

  // Helper for generating initials
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex justify-between items-end flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Query Management</h2>
          <p className="text-sm text-slate-500 mt-1">
            Drag and drop cards across stages to move them through your sales pipeline.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white px-4 py-2 border border-slate-200 rounded-lg shadow-sm flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Pipeline</span>
            <span className="text-sm font-bold text-slate-700">{queries.length} Queries</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full items-start">
            {STAGES.map(stage => {
              const stageQueries = queries.filter(q => q.status === stage.id);
              const isDragOver = dragOverStage === stage.id;
              
              return (
                <div 
                  key={stage.id} 
                  className={`w-full flex flex-col rounded-xl transition-colors duration-200 ${isDragOver ? 'bg-slate-100/80 ring-2 ring-blue-400 ring-inset' : 'bg-slate-50/60 border border-slate-200'}`}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  {/* Section Header */}
                  <div className={`px-5 py-3 border-b ${stage.border} ${stage.headerBg} rounded-t-xl flex justify-between items-center shadow-sm`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`}></div>
                      <span className={`font-semibold text-sm ${stage.textColor}`}>{stage.label}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold bg-white shadow-sm ${stage.textColor}`}>
                      {stageQueries.length} Queries
                    </span>
                  </div>
                  
                  {/* Section Body (Table View) */}
                  <div className="p-0 min-h-[120px] overflow-x-auto custom-scrollbar">
                    {stageQueries.length > 0 ? (
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-1/4">Client</th>
                            <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                            <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Trip Details</th>
                            <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Updated</th>
                            <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {stageQueries.map(query => {
                            const isDragging = draggingId === query.id;
                            
                            return (
                              <tr 
                                key={query.id} 
                                draggable={draggableCardId === query.id} 
                                onDragStart={(e) => handleDragStart(e, query.id)}
                                onDragEnd={handleDragEnd}
                                className={`bg-white hover:bg-blue-50/50 transition-colors group ${
                                  isDragging ? 'opacity-50' : ''
                                } ${draggableCardId === query.id ? 'cursor-grab active:cursor-grabbing' : ''}`}
                              >
                                {/* Client Info */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <button 
                                      className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0" 
                                      onMouseEnter={() => setDraggableCardId(query.id)}
                                      onMouseLeave={() => setDraggableCardId(null)}
                                      title="Drag Row"
                                    >
                                      <GripVertical size={16} />
                                    </button>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                                      {getInitials(query.name)}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-slate-800 text-sm leading-tight truncate max-w-[150px]">{query.name}</h4>
                                      <div className="text-[10px] font-medium text-slate-400 mt-0.5">#{query.id + 2500000}</div>
                                    </div>
                                  </div>
                                </td>
                                
                                {/* Contact */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                    <Phone size={12} className="text-slate-400" /> {query.phone}
                                  </div>
                                </td>

                                {/* Trip Details */}
                                <td className="px-4 py-3">
                                  {query.destination ? (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                      <MapPin size={12} className="text-blue-500" />
                                      <span className="font-medium truncate max-w-[120px]">{query.destination}</span>
                                      {query.numDays && <span className="text-slate-400 ml-1">({query.numDays}D)</span>}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">Not specified</span>
                                  )}
                                </td>

                                {/* Updated */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded w-fit font-medium border border-amber-200/50">
                                    <Clock size={10} /> {new Date(query.updatedAt).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}
                                  </div>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-emerald-100 hover:border-emerald-500" title="WhatsApp">
                                      <MessageCircle size={13} />
                                    </button>
                                    <button className="w-7 h-7 rounded bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-blue-100 hover:border-blue-600" title="Call">
                                      <Phone size={13} />
                                    </button>
                                    <button 
                                      onClick={() => handleOpenQuotation(query)}
                                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-white hover:bg-slate-700 transition-colors text-[10px] font-medium shadow-sm ml-1"
                                    >
                                      <FileText size={12} />
                                      Quote
                                    </button>
                                    
                                    {/* Dropdown Menu Toggle */}
                                    <div className="relative flex items-center">
                                      <button 
                                        className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-100 ml-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenDropdownId(openDropdownId === query.id ? null : query.id);
                                        }}
                                      >
                                        <MoreVertical size={14} />
                                      </button>
                                      {openDropdownId === query.id && (
                                        <div className="absolute top-8 right-0 w-36 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 text-left">
                                          <div className="py-1">
                                            <button onClick={() => { setOpenDropdownId(null); handleEditClick(query); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">Edit Details</button>
                                            <button onClick={() => { setOpenDropdownId(null); const note = window.prompt('Enter your note:'); if (note) handleAddNote(query.id, note); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">Add Note</button>
                                            <div className="h-px bg-slate-100 my-1"></div>
                                            <button onClick={() => { setOpenDropdownId(null); handleDeleteQuery(query.id); }} className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">Delete Query</button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-24 text-slate-400 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/50 m-4 hover:bg-slate-100 transition-colors">
                        <span className="text-xs font-medium">Drop queries here to move to {stage.label}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Global Scrollbar style just for this component to keep it sleek */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      
      <SendQuotationModal 
        isOpen={isQuotationModalOpen}
        onClose={handleCloseQuotation}
        query={selectedQuotationQuery}
      />

      {/* Edit Query Modal */}
      {isEditModalOpen && createPortal(
        <div className={`fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm ${isClosingEdit ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto ${isClosingEdit ? 'animate-slide-out-left' : 'animate-slide-in-left'}`}>
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800">Edit Query Details</h3>
              <button onClick={handleCloseEditModal} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md p-1 transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleUpdateQuery} className="p-5 space-y-3.5">
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Customer Name</label>
                <input 
                  type="text" 
                  value={editingQuery?.name || ''}
                  onChange={(e) => setEditingQuery({...editingQuery, name: e.target.value})}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Phone Number</label>
                  <input 
                    type="text" 
                    value={editingQuery?.phone || ''}
                    onChange={(e) => setEditingQuery({...editingQuery, phone: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    value={editingQuery?.email || ''}
                    onChange={(e) => setEditingQuery({...editingQuery, email: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2"></div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Destination</label>
                <select
                  value={editingQuery?.destination || ''}
                  onChange={(e) => setEditingQuery({...editingQuery, destination: e.target.value})}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                >
                  <option value="">Select a Destination</option>
                  {destinations.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                  {/* Fallback if the current destination is not in the list */}
                  {editingQuery?.destination && !destinations.some(d => d.name === editingQuery.destination) && (
                    <option value={editingQuery.destination}>{editingQuery.destination}</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Travel Date</label>
                  <input 
                    type="date" 
                    value={editingQuery?.travelDate || ''}
                    onChange={(e) => setEditingQuery({...editingQuery, travelDate: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Pax</label>
                    <input 
                      type="number" 
                      min="1"
                      value={editingQuery?.pax || ''}
                      onChange={(e) => setEditingQuery({...editingQuery, pax: e.target.value})}
                      placeholder="e.g. 2"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Days</label>
                    <input 
                      type="number" 
                      min="1"
                      value={editingQuery?.numDays || ''}
                      onChange={(e) => setEditingQuery({...editingQuery, numDays: e.target.value})}
                      placeholder="e.g. 5"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors text-center"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-2.5">
                <button type="button" onClick={handleCloseEditModal} className="px-4 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default QueriesPipeline;
