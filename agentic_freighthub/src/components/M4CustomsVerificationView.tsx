import React, { useState, useEffect } from 'react';
import { VerificationRequest, VerificationChecklist } from '../types';
import { CheckCircle2, XCircle, FileText, AlertCircle, Clock, Check, Loader2, Info, Shield, RefreshCw, Eye, Image, File as FileIcon } from 'lucide-react';

interface SelectedQuote {
  selectedQuoteId: string;
  quoteId: string;
  customerId: string;
  customerEmail: string;
  companyName: string;
  companyId: string;
  originCode: string;
  destinationCode: string;
  transportMode: string;
  tariffAmount: number;
  currency: string;
  shipperEmail: string;
  status: string;
  agentRemarks: string;
  reviewedBy: string;
  reviewedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const M4CustomsVerificationView: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionReason, setActionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected quotes for customs approval
  const [selectedQuotes, setSelectedQuotes] = useState<SelectedQuote[]>([]);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<SelectedQuote | null>(null);
  const [customsActionReason, setCustomsActionReason] = useState('');
  const [customsSubmitting, setCustomsSubmitting] = useState(false);
  const [quoteDocuments, setQuoteDocuments] = useState<any[]>([]);
  const [proofDocuments, setProofDocuments] = useState<any[]>([]);

  const fetchSelectedQuotes = async () => {
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch('/api/selected-quotes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSelectedQuotes(result.data || []);
      }
    } catch {
      // ignore
    }
  };

  const handleCustomsAction = async (selectedQuoteId: string, action: 'CUSTOMS_APPROVED' | 'REJECTED') => {
    setCustomsSubmitting(true);
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch(`/api/selected-quotes/${selectedQuoteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action, agentRemarks: customsActionReason || `Customs ${action === 'CUSTOMS_APPROVED' ? 'approved' : 'rejected'}` })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        fetchSelectedQuotes();
        setSelectedQuoteDetail(null);
        setCustomsActionReason('');
      }
    } catch {
      // ignore
    } finally {
      setCustomsSubmitting(false);
    }
  };

  const fetchQuoteDocuments = async (selectedQuoteId: string) => {
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch(`/api/selected-quotes/${selectedQuoteId}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setQuoteDocuments(result.data || []);
      } else {
        setQuoteDocuments([]);
      }
    } catch {
      setQuoteDocuments([]);
    }
  };

  // Fetch proof documents (Aadhaar, Company Verification, Address Proof) for the customer
  const fetchProofDocuments = async (customerEmail: string) => {
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch(`/api/selected-quotes/proof-documents/completeness/${encodeURIComponent(customerEmail)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setProofDocuments(result.data.completeness || []);
      } else {
        setProofDocuments([]);
      }
    } catch {
      setProofDocuments([]);
    }
  };

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
    fetchSelectedQuotes();
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

  useEffect(() => {
    if (selectedQuoteDetail) {
      fetchQuoteDocuments(selectedQuoteDetail.selectedQuoteId);
      // Fetch proof documents for this customer
      const customerEmail = selectedQuoteDetail.customerEmail || selectedQuoteDetail.shipperEmail;
      if (customerEmail) {
        fetchProofDocuments(customerEmail);
      }
    }
  }, [selectedQuoteDetail]);

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

  // Selected quotes ready for customs review (status = UNDER_REVIEW)
  const quotesForCustomsReview = selectedQuotes.filter(q => q.status === 'UNDER_REVIEW');
  const quotesApprovedByCustoms = selectedQuotes.filter(q => q.status === 'CUSTOMS_APPROVED' || q.status === 'APPROVED' || q.status === 'REJECTED');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
      {/* Left Column: Queue */}
      <div className="lg:col-span-4 space-y-4">
        {/* Selected Quotes for Customs Approval */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              Customs Quote Approval
            </h3>
            <button onClick={fetchSelectedQuotes} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="space-y-2">
            {quotesForCustomsReview.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                No quotes pending customs review
              </div>
            ) : (
              quotesForCustomsReview.map((item) => (
                <button
                  key={item.selectedQuoteId}
                  onClick={() => { setSelectedQuoteDetail(item); setCustomsActionReason(''); }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all ${
                    selectedQuoteDetail?.selectedQuoteId === item.selectedQuoteId
                      ? 'border-amber-500 bg-amber-50 shadow-md ring-1 ring-amber-500/20'
                      : 'border-amber-200 bg-amber-50 hover:border-amber-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-black text-amber-900">{item.quoteId}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 uppercase">
                      FOR CUSTOMS
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-700">{item.originCode} → {item.destinationCode}</div>
                  <div className="text-[10px] text-amber-600 font-bold">{item.currency} {item.tariffAmount?.toLocaleString()}</div>
                  <div className="text-[10px] text-amber-500">Customer: {item.customerEmail}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Existing Verification Queue */}
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
        {!selectedRequest && !selectedQuoteDetail ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-3 h-full min-h-[400px]">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-600">Select a request</p>
              <p className="text-xs text-slate-400">Choose a verification request or quote from the queue to review.</p>
            </div>
          </div>
        ) : selectedQuoteDetail ? (
          /* Selected Quote Detail View for Customs */
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-amber-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-black text-slate-900">{selectedQuoteDetail.quoteId}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      PENDING CUSTOMS REVIEW
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Customer: {selectedQuoteDetail.customerEmail} | Company: {selectedQuoteDetail.companyName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedQuoteDetail(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Route & Price */}
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Shipment Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Origin</span>
                    <span className="text-sm font-black text-slate-900">{selectedQuoteDetail.originCode}</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Destination</span>
                    <span className="text-sm font-black text-slate-900">{selectedQuoteDetail.destinationCode}</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Mode</span>
                    <span className="text-sm font-black text-slate-900 uppercase">{selectedQuoteDetail.transportMode}</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Price</span>
                    <span className="text-sm font-black text-blue-700">{selectedQuoteDetail.currency} {selectedQuoteDetail.tariffAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Email</span>
                    <span className="text-sm font-medium text-slate-900">{selectedQuoteDetail.customerEmail}</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Company</span>
                    <span className="text-sm font-medium text-slate-900">{selectedQuoteDetail.companyName}</span>
                  </div>
                </div>
              </div>

              {/* Agent Review Info */}
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Agent Review Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Reviewed By</span>
                    <span className="text-sm font-medium text-slate-900">{selectedQuoteDetail.reviewedBy || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Reviewed At</span>
                    <span className="text-sm font-medium text-slate-900">{selectedQuoteDetail.reviewedAt ? new Date(selectedQuoteDetail.reviewedAt).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Selection Info */}
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Selection Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Selected At</span>
                    <span className="text-sm font-medium text-slate-900">{new Date(selectedQuoteDetail.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">ID</span>
                    <span className="text-sm font-mono font-medium text-slate-900">{selectedQuoteDetail.selectedQuoteId}</span>
                  </div>
                </div>
              </div>

              {/* Customer Uploaded Documents */}
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Customer Proof Documents</h4>
                {/* Show the 3 required proof document types */}
                <div className="space-y-2 mb-4">
                  {[
                    { type: 'AADHAAR', label: 'Aadhaar / Identity Proof' },
                    { type: 'COMPANY_VERIFICATION', label: 'Company Verification Proof' },
                    { type: 'ADDRESS_PROOF', label: 'Business / Address Proof' },
                  ].map((slot) => {
                    const doc = proofDocuments.find((d: any) => d.documentType === slot.type);
                    const isUploaded = doc?.status === 'UPLOADED';
                    return (
                      <div key={slot.type} className={`flex items-center gap-3 p-3 rounded-xl border ${
                        isUploaded ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                      }`}>
                        {isUploaded ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{slot.label}</p>
                          {isUploaded ? (
                            <p className="text-[10px] text-emerald-600 font-medium">{doc.fileName} · Uploaded</p>
                          ) : (
                            <p className="text-[10px] text-amber-600 font-medium">Not Uploaded</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Show additional quote documents if any */}
                {quoteDocuments.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Additional Documents</p>
                    <div className="space-y-2">
                      {quoteDocuments.map((doc: any) => (
                        <div key={doc.docId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          {doc.mimeType?.includes('image') ? (
                            <div className="p-2 bg-blue-100 rounded-lg"><Image className="w-5 h-5 text-blue-600" /></div>
                          ) : (
                            <div className="p-2 bg-red-100 rounded-lg"><FileIcon className="w-5 h-5 text-red-600" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{doc.fileName}</p>
                            <p className="text-[10px] text-slate-400">{(doc.fileSize / 1024).toFixed(1)} KB · {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : ''}</p>
                          </div>
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-colors">
                              <Eye className="w-3.5 h-3.5" /> Preview
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {proofDocuments.length === 0 && quoteDocuments.length === 0 && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                    <FileText className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No documents uploaded by customer yet</p>
                  </div>
                )}
              </div>

              {/* Customs Action */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Customs Remarks</label>
                  <textarea
                    value={customsActionReason}
                    onChange={(e) => setCustomsActionReason(e.target.value)}
                    placeholder="Enter customs remarks (required for rejection)..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    rows={2}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCustomsAction(selectedQuoteDetail.selectedQuoteId, 'CUSTOMS_APPROVED')}
                    disabled={customsSubmitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Approve Quote
                  </button>
                  <button
                    onClick={() => handleCustomsAction(selectedQuoteDetail.selectedQuoteId, 'REJECTED')}
                    disabled={customsSubmitting}
                    className="flex-1 bg-white hover:bg-slate-50 text-red-600 border border-red-200 font-bold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Reject Quote
                  </button>
                </div>
              </div>
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
                  {selectedRequest.resubmissionCount ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      RESUBMITTED ({selectedRequest.resubmissionCount}x)
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">
                  Quote Snapshot: <span className="font-mono font-medium">{selectedRequest.quoteId}</span> (v{selectedRequest.quoteSnapshot.version || 1})
                </p>
              </div>
            </div>

            {/* Resubmission History */}
            {selectedRequest.rejectionHistory && selectedRequest.rejectionHistory.length > 0 && (
              <div className="p-5 border-b border-slate-100 bg-amber-50">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-3">
                  Previous Rejection History
                </h4>
                <div className="space-y-2">
                  {selectedRequest.rejectionHistory.map((record, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-white rounded-lg border border-amber-200">
                      <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-700">
                          Attempt {idx + 1} — Rejected by {record.role === 'customs-officer' ? 'Customs Officer' : 'Freight Agent'}
                        </p>
                        <p className="text-[10px] text-slate-500">{record.reason}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {new Date(record.rejectedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} at{' '}
                          {new Date(record.rejectedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedRequest.lastResubmittedAt && (
                  <p className="text-[10px] text-amber-700 font-bold mt-2">
                    Customer resubmitted: {new Date(selectedRequest.lastResubmittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} at{' '}
                    {new Date(selectedRequest.lastResubmittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            )}

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
