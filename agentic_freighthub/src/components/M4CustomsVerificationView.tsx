import React, { useState, useEffect } from 'react';
import { VerificationRequest, VerificationChecklist } from '../types';
import { CheckCircle2, XCircle, FileText, AlertCircle, Clock, Check, Loader2, Info } from 'lucide-react';

export const M4CustomsVerificationView: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionReason, setActionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('freighthub_session_token');
      if (!token) return;
      const response = await fetch('/api/verifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch verification requests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  // Sync selectedRequest with latest fetch
  useEffect(() => {
    if (selectedRequest) {
      const updated = requests.find(r => r.requestId === selectedRequest.requestId);
      if (updated && updated.updatedAt !== selectedRequest.updatedAt) {
        setSelectedRequest(updated);
      }
    }
  }, [requests, selectedRequest]);

  const handleToggleChecklistItem = async (key: keyof VerificationChecklist) => {
    if (!selectedRequest) return;
    
    // Optimistic UI update
    const updatedChecklist = {
      ...selectedRequest.checklist,
      [key]: !selectedRequest.checklist[key]
    };
    
    setSelectedRequest({ ...selectedRequest, checklist: updatedChecklist });

    try {
      const token = localStorage.getItem('freighthub_session_token');
      await fetch(`/api/verifications/${selectedRequest.requestId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ checklist: updatedChecklist })
      });
      fetchRequests();
    } catch (e) {
      console.error('Failed to update checklist', e);
      setErrorMsg('Failed to save checklist update.');
    }
  };

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO') => {
    if (!selectedRequest) return;
    if ((action === 'REJECT' || action === 'REQUEST_INFO') && !actionReason.trim()) {
      setErrorMsg(`Reason required for ${action}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('freighthub_session_token');
      const response = await fetch(`/api/verifications/${selectedRequest.requestId}/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          modificationReason: action === 'REJECT' ? actionReason : undefined,
          missingInfoRequested: action === 'REQUEST_INFO' ? actionReason.split(',').map(s => s.trim()) : undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        setActionReason('');
        setSelectedRequest(null);
        fetchRequests();
      } else {
        setErrorMsg(data.error || 'Action failed');
      }
    } catch (e) {
      setErrorMsg('Network error while processing action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Approved</span>;
      case 'REJECTED': return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Rejected</span>;
      case 'INFO_REQUESTED': return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Info Req</span>;
      case 'REVISION_ISSUED': return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Rev Issued</span>;
      default: return <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">{status}</span>;
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  const activeRequests = requests.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
  const completedRequests = requests.filter(r => r.status !== 'PENDING' && r.status !== 'IN_PROGRESS');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
      {/* Left Column: Queue */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Verification Queue
          </h3>
          
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Needs Review</div>
            {activeRequests.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">No pending requests</div>
            ) : (
              activeRequests.map(req => (
                <button
                  key={req.requestId}
                  onClick={() => { setSelectedRequest(req); setActionReason(''); setErrorMsg(''); }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all ${selectedRequest?.requestId === req.requestId ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs font-black text-slate-900">{req.requestId}</span>
                    {getStatusBadge(req.status)}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium truncate">Customer: {req.customerId}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Updated: {new Date(req.updatedAt).toLocaleString()}</div>
                </button>
              ))
            )}

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 pt-4">Completed / Paused</div>
            {completedRequests.map(req => (
              <button
                key={req.requestId}
                onClick={() => { setSelectedRequest(req); setActionReason(''); setErrorMsg(''); }}
                className={`w-full text-left p-3 rounded-2xl border transition-all ${selectedRequest?.requestId === req.requestId ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-xs font-black text-slate-500">{req.requestId}</span>
                  {getStatusBadge(req.status)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Details */}
      <div className="lg:col-span-8">
        {!selectedRequest ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-3 h-full min-h-[400px]">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-600">Select a request</p>
              <p className="text-xs text-slate-400">Choose a verification request from the queue to review documents and sign off.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-black text-slate-900">{selectedRequest.requestId}</h2>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <p className="text-xs text-slate-500">
                  Quote Snapshot: <span className="font-mono font-medium">{selectedRequest.quoteId}</span> (v{selectedRequest.quoteSnapshot.version || 1})
                </p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Shipment Details */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Shipment Details</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-400 mb-0.5">Route</span>
                    <span className="font-bold text-slate-800">{selectedRequest.quoteSnapshot.originCode} → {selectedRequest.quoteSnapshot.destinationCode}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-0.5">Mode</span>
                    <span className="font-bold text-slate-800 uppercase">{selectedRequest.quoteSnapshot.transportMode}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-0.5">Cargo Info</span>
                    <span className="font-bold text-slate-800">{selectedRequest.quoteSnapshot.cargoSummary}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-0.5">Company</span>
                    <span className="font-bold text-slate-800">{selectedRequest.quoteSnapshot.companyId}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-slate-400 mb-0.5">Price</span>
                    <span className="font-black text-blue-700 text-sm">{selectedRequest.quoteSnapshot.currency || 'USD'} {selectedRequest.quoteSnapshot.tariffAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Document Checklist */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Document Checklist</h4>
                  <span className="text-[10px] font-bold text-slate-500">
                    {Object.values(selectedRequest.checklist).filter(Boolean).length} / {Object.keys(selectedRequest.checklist).length} Verified
                  </span>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(selectedRequest.checklist).map(([key, isVerified]) => (
                    <button
                      key={key}
                      onClick={() => handleToggleChecklistItem(key as keyof VerificationChecklist)}
                      disabled={selectedRequest.status === 'APPROVED' || selectedRequest.status === 'REJECTED'}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${isVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${isVerified ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className={`text-xs font-bold capitalize ${isVerified ? 'text-emerald-900' : 'text-slate-700'}`}>{key}</p>
                          <p className={`text-[10px] ${isVerified ? 'text-emerald-600' : 'text-slate-500'}`}>Required</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 mt-auto">
              {(selectedRequest.status === 'APPROVED' || selectedRequest.status === 'REJECTED') ? (
                <div className="p-4 bg-white border border-slate-200 rounded-xl text-center space-y-2">
                  <div className="flex justify-center text-slate-400 mb-2"><CheckCircle2 className="w-8 h-8" /></div>
                  <p className="text-sm font-bold text-slate-700">Verification Complete</p>
                  <p className="text-xs text-slate-500">This request has been {selectedRequest.status.toLowerCase()} and cannot be modified.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> {errorMsg}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Action Notes / Missing Docs</label>
                    <input
                      type="text"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Enter reason for rejection or list missing docs (comma separated)..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction('APPROVE')}
                      disabled={isSubmitting || Object.values(selectedRequest.checklist).some(val => !val)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve & Auto-Book
                    </button>
                    <button
                      onClick={() => handleAction('REQUEST_INFO')}
                      disabled={isSubmitting || !actionReason}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                      <Info className="w-4 h-4" /> Request Info
                    </button>
                    <button
                      onClick={() => handleAction('REJECT')}
                      disabled={isSubmitting || !actionReason}
                      className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 font-bold py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                  {Object.values(selectedRequest.checklist).some(val => !val) && (
                    <p className="text-[10px] text-amber-600 font-bold text-center">Cannot approve until all required documents are verified.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
