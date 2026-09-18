import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  Send,
  Check,
  X,
  Info,
  Shield
} from 'lucide-react';
import {
  DocumentRecord,
  VerificationRequest,
  DocumentType,
  DocumentStatus,
  DocumentVerificationChecklist,
  DocumentChecklistItem
} from '../types';

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
  calculationSnapshot?: {
    baseFreight: number;
    bafFuelSurcharge: number;
    originThc: number;
    documentationFee: number;
    specialHandling: number;
    insuranceFee: number;
    discountAmount: number;
    totalCost: number;
    marginPercentage: number;
    marginAmount: number;
    finalSellPrice: number;
    routeDetails: {
      originPort: string;
      destinationPort: string;
      distance: string;
      transitDays: string;
      estimatedArrival: string;
    };
  } | null;
  availableQuotes?: {
    quoteId: string;
    companyName: string;
    companyId: string;
    tariffAmount: number;
    currency: string;
    originCode: string;
    destinationCode: string;
    transportMode: string;
    calculationSnapshot?: {
      baseFreight: number;
      bafFuelSurcharge: number;
      originThc: number;
      documentationFee: number;
      specialHandling: number;
      insuranceFee: number;
      discountAmount: number;
      totalCost: number;
      marginPercentage: number;
      marginAmount: number;
      finalSellPrice: number;
      routeDetails: {
        originPort: string;
        destinationPort: string;
        distance: string;
        transitDays: string;
        estimatedArrival: string;
      };
    } | null;
  }[];
}

interface M4AgentDocumentReviewProps {
  companyId: string;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  COMMERCIAL_INVOICE: 'Commercial Invoice',
  PACKING_LIST: 'Packing List',
  CUSTOMS_DOCUMENT: 'Customs Document',
  INSURANCE: 'Insurance Certificate',
  BILL_OF_LADING: 'Bill of Lading',
  CERTIFICATE_OF_ORIGIN: 'Certificate of Origin',
  OTHER: 'Other Document',
};

const STATUS_CONFIG: Record<DocumentStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  REQUESTED: { color: 'text-amber-700', bg: 'bg-amber-100', icon: <Clock className="w-3.5 h-3.5" /> },
  UPLOADED: { color: 'text-blue-700', bg: 'bg-blue-100', icon: <FileText className="w-3.5 h-3.5" /> },
  UNDER_REVIEW: { color: 'text-purple-700', bg: 'bg-purple-100', icon: <Eye className="w-3.5 h-3.5" /> },
  VERIFIED: { color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  REJECTED: { color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="w-3.5 h-3.5" /> },
  MISSING: { color: 'text-red-700', bg: 'bg-red-100', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

export const M4AgentDocumentReview: React.FC<M4AgentDocumentReviewProps> = ({ companyId }) => {
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [checklist, setChecklist] = useState<DocumentVerificationChecklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [requestInfoModal, setRequestInfoModal] = useState(false);
  const [requestInfoText, setRequestInfoText] = useState('');
  const [selectedDocTypes, setSelectedDocTypes] = useState<DocumentType[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [verifyRemarks, setVerifyRemarks] = useState<Record<string, string>>({});
  const [expandedCompanyQuote, setExpandedCompanyQuote] = useState<string | null>(null);

  // Selected quotes from API
  const [selectedQuotes, setSelectedQuotes] = useState<SelectedQuote[]>([]);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<SelectedQuote | null>(null);
  const [agentProofDocs, setAgentProofDocs] = useState<any[]>([]);

  // Fetch selected quotes from API
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

  // Fetch proof document completeness for a customer
  const fetchAgentProofDocs = async (customerEmail: string) => {
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch(`/api/selected-quotes/proof-documents/completeness/${encodeURIComponent(customerEmail)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAgentProofDocs(result.data.completeness || []);
      } else {
        setAgentProofDocs([]);
      }
    } catch {
      setAgentProofDocs([]);
    }
  };

  // Fetch verification requests for this company
  const fetchVerificationRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch('/api/verifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setVerificationRequests([]);
        return;
      }
      const companyRequests = (result.data || []).filter(
        (r: VerificationRequest) => r.companyId === companyId
      );
      setVerificationRequests(companyRequests);
    } catch (err: any) {
      setVerificationRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch documents for a verification request
  const fetchDocuments = async (requestId: string) => {
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch(`/api/m4/documents/request/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load documents');
      }
      setDocuments(result.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    }
  };

  // Fetch checklist for a verification request
  const fetchChecklist = async (requestId: string) => {
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch(`/api/m4/documents/checklist/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setChecklist(result.data);
      } else {
        // Create checklist if it doesn't exist
        await createChecklist(requestId);
      }
    } catch (err: any) {
      console.error('Failed to load checklist', err);
    }
  };

  // Create a new checklist
  const createChecklist = async (requestId: string) => {
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch('/api/m4/documents/checklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setChecklist(result.data);
      }
    } catch (err: any) {
      console.error('Failed to create checklist', err);
    }
  };

  useEffect(() => {
    fetchVerificationRequests();
    fetchSelectedQuotes();
  }, [companyId]);

  useEffect(() => {
    if (selectedRequest) {
      fetchDocuments(selectedRequest.requestId);
      fetchChecklist(selectedRequest.requestId);
    }
  }, [selectedRequest]);

  // Request documents from customer
  const handleRequestDocuments = async () => {
    if (!selectedRequest || selectedDocTypes.length === 0) return;

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch('/api/m4/documents/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: selectedRequest.requestId,
          documentTypes: selectedDocTypes,
          remarks: requestInfoText || 'Documents required for verification',
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to request documents');
      }

      setSuccessMsg('Document request sent to customer');
      setRequestInfoModal(false);
      setRequestInfoText('');
      setSelectedDocTypes([]);
      fetchDocuments(selectedRequest.requestId);
    } catch (err: any) {
      setError(err.message || 'Failed to request documents');
    } finally {
      setActionLoading(false);
    }
  };

  // Verify a document
  const handleVerifyDocument = async (documentId: string) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch(`/api/m4/documents/${documentId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ remarks: verifyRemarks[documentId] || '' }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to verify document');
      }

      setSuccessMsg('Document verified successfully');
      if (selectedRequest) {
        fetchDocuments(selectedRequest.requestId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify document');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject a document
  const handleRejectDocument = async (documentId: string) => {
    const remarks = verifyRemarks[documentId];
    if (!remarks) {
      setError('Remarks are required when rejecting a document');
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch(`/api/m4/documents/${documentId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ remarks }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to reject document');
      }

      setSuccessMsg('Document rejected');
      if (selectedRequest) {
        fetchDocuments(selectedRequest.requestId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject document');
    } finally {
      setActionLoading(false);
    }
  };

  // Update checklist item
  const handleChecklistUpdate = async (documentType: DocumentType, status: DocumentStatus) => {
    if (!selectedRequest) return;

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch(`/api/m4/documents/checklist/${selectedRequest.requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documentType, status }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update checklist');
      }

      setChecklist(result.data);
      setSuccessMsg('Checklist updated');
    } catch (err: any) {
      setError(err.message || 'Failed to update checklist');
    } finally {
      setActionLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: DocumentStatus) => {
    const config = STATUS_CONFIG[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color}`}>
        {config.icon}
        {status}
      </span>
    );
  };

  // Handle selected quote action via API
  const handleSelectedQuoteAction = async (selectedQuoteId: string, action: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch(`/api/selected-quotes/${selectedQuoteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action, agentRemarks: action === 'REJECTED' ? 'Quote rejected by agent' : '' })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const actionLabel = action === 'APPROVED' ? 'approved' : action === 'UNDER_REVIEW' ? 'moved to review' : 'rejected';
        setSuccessMsg(`Quote ${selectedQuoteId} ${actionLabel} successfully!`);
        fetchSelectedQuotes();
      } else {
        setError(result.error || 'Failed to update quote');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update quote');
    } finally {
      setActionLoading(false);
    }
  };

  // Get active requests (pending or in progress)
  const activeRequests = verificationRequests.filter(
    (r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS' || r.status === 'INFO_REQUESTED'
  );

  // Get completed requests
  const completedRequests = verificationRequests.filter(
    (r) => r.status === 'APPROVED' || r.status === 'REJECTED' || r.status === 'REVISION_ISSUED'
  );

  // Get document statistics
  const getDocumentStats = () => {
    const total = documents.length;
    const verified = documents.filter((d) => d.status === 'VERIFIED').length;
    const pending = documents.filter((d) => d.status === 'UPLOADED' || d.status === 'UNDER_REVIEW').length;
    const missing = documents.filter((d) => d.status === 'MISSING' || d.status === 'REQUESTED').length;
    return { total, verified, pending, missing };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading verification requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Document Review</h2>
          <p className="text-sm text-slate-500 mt-1">
            Review and verify documents for shipment verification requests.
          </p>
        </div>
        <button
          onClick={fetchVerificationRequests}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* No Active Requests */}
      {activeRequests.length === 0 && completedRequests.length === 0 && selectedQuotes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-700">No Verification Requests</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            There are no verification requests for your company at this time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Request Queue */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-blue-600" />
                Verification Queue
              </h3>

              <div className="space-y-2">
                {/* Customer Selected Quotes - Needs Review */}
                {selectedQuotes.filter(q => q.status === 'SELECTED').length > 0 && (
                  <>
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest px-1">
                      Customer Selected ({selectedQuotes.filter(q => q.status === 'SELECTED').length})
                    </div>
                    {selectedQuotes.filter(q => q.status === 'SELECTED').map((item) => (
                      <button
                        key={item.selectedQuoteId}
                        onClick={() => { setSelectedQuoteDetail(item); setSuccessMsg(null); setError(null); fetchAgentProofDocs(item.customerEmail || item.shipperEmail); }}
                        className={`w-full text-left p-3 rounded-2xl border transition-all ${
                          selectedQuoteDetail?.selectedQuoteId === item.selectedQuoteId
                            ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500/20'
                            : 'border-blue-300 bg-blue-50 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-xs font-black text-blue-900">{item.quoteId}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-blue-200 text-blue-800">
                            {item.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-blue-700 font-medium truncate">
                          Customer: {item.customerEmail || 'Customer'}
                        </div>
                        <div className="text-[10px] text-blue-500 mt-1">
                          {item.originCode} → {item.destinationCode}
                        </div>
                        <div className="text-[10px] text-blue-600 font-bold mt-1">
                          {item.currency} {item.tariffAmount?.toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* Under Review Quotes */}
                {selectedQuotes.filter(q => q.status === 'UNDER_REVIEW').length > 0 && (
                  <>
                    <div className="text-[10px] font-bold text-purple-500 uppercase tracking-widest px-1 pt-2">
                      Under Review ({selectedQuotes.filter(q => q.status === 'UNDER_REVIEW').length})
                    </div>
                    {selectedQuotes.filter(q => q.status === 'UNDER_REVIEW').map((item) => (
                      <div
                        key={item.selectedQuoteId}
                        className="w-full text-left p-3 rounded-2xl border border-purple-300 bg-purple-50"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-xs font-black text-purple-900">{item.quoteId}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-purple-200 text-purple-800">
                            UNDER REVIEW
                          </span>
                        </div>
                        <div className="text-[11px] text-purple-700 font-medium truncate">
                          {item.customerEmail}
                        </div>
                        <div className="text-[10px] text-purple-500 mt-1">
                          {item.originCode} → {item.destinationCode}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                  Needs Review ({activeRequests.length})
                </div>
                {activeRequests.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    No pending requests
                  </div>
                ) : (
                  activeRequests.map((req) => (
                    <button
                      key={req.requestId}
                      onClick={() => {
                        setSelectedRequest(req);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all ${
                        selectedRequest?.requestId === req.requestId
                          ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500/20'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono text-xs font-black text-slate-900">{req.requestId}</span>
                        <div className="flex items-center gap-1">
                          {req.resubmissionCount ? (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              RESUBMIT
                            </span>
                          ) : null}
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                              req.status === 'PENDING'
                                ? 'bg-slate-200 text-slate-800'
                                : req.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium truncate">
                        Customer: {req.customerId}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {req.quoteSnapshot.originCode} → {req.quoteSnapshot.destinationCode}
                      </div>
                    </button>
                  ))
                )}

                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 pt-4">
                  Completed ({completedRequests.length})
                </div>
                {completedRequests.map((req) => (
                  <button
                    key={req.requestId}
                    onClick={() => {
                      setSelectedRequest(req);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all ${
                      selectedRequest?.requestId === req.requestId
                        ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-xs font-black text-slate-500">{req.requestId}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content - Document Review */}
          <div className="lg:col-span-8">
            {!selectedRequest && !selectedQuoteDetail ? (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-3 h-full min-h-[400px]">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-600">Select a request</p>
                  <p className="text-xs text-slate-400">
                    Choose a verification request or customer quote from the queue to review.
                  </p>
                </div>
              </div>
            ) : selectedQuoteDetail ? (
              /* Customer Selected Quote Detail - Read Only */
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-slate-900">{selectedQuoteDetail.quoteId}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {selectedQuoteDetail.status}
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
                  {/* Quote Information */}
                  <div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Quote Details</h4>
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
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Transport Mode</span>
                        <span className="text-sm font-black text-slate-900 uppercase">{selectedQuoteDetail.transportMode}</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Price</span>
                        <span className="text-sm font-black text-blue-700">{selectedQuoteDetail.currency} {selectedQuoteDetail.tariffAmount?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Customer Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer Email</span>
                        <span className="text-sm font-medium text-slate-900">{selectedQuoteDetail.customerEmail}</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Company</span>
                        <span className="text-sm font-medium text-slate-900">{selectedQuoteDetail.companyName}</span>
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
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Selected Quote ID</span>
                        <span className="text-sm font-mono font-medium text-slate-900">{selectedQuoteDetail.selectedQuoteId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Document Completeness */}
                  <div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Customer Document Completeness</h4>
                    <p className="text-[10px] text-slate-400 mb-3">Documents are checked for presence only — not verified.</p>
                    {agentProofDocs.length > 0 ? (
                      <div className="space-y-2">
                        {agentProofDocs.map((doc: any) => {
                          const docLabels: Record<string, string> = {
                            AADHAAR: 'Aadhaar / Identity Proof',
                            COMPANY_VERIFICATION: 'Company Verification Proof',
                            ADDRESS_PROOF: 'Business / Address Proof',
                          };
                          return (
                            <div key={doc.documentType} className={`flex items-center gap-3 p-3 rounded-xl border ${
                              doc.status === 'UPLOADED' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                            }`}>
                              {doc.status === 'UPLOADED' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800">{docLabels[doc.documentType] || doc.documentType}</p>
                                {doc.status === 'UPLOADED' ? (
                                  <p className="text-[10px] text-emerald-600 font-medium">{doc.fileName} · Uploaded</p>
                                ) : (
                                  <p className="text-[10px] text-amber-600 font-medium">Missing</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div className="mt-2 text-[10px] font-bold text-slate-500">
                          {agentProofDocs.filter((d: any) => d.status === 'UPLOADED').length} / {agentProofDocs.length} documents uploaded
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                        <FileText className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No proof documents found for this customer</p>
                      </div>
                    )}
                  </div>

                  {/* All Company Quotes */}
                  {selectedQuoteDetail.availableQuotes && selectedQuoteDetail.availableQuotes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">All Company Quotes ({selectedQuoteDetail.availableQuotes.length})</h4>
                      <div className="space-y-3">
                        {selectedQuoteDetail.availableQuotes.map((companyQuote) => {
                          const isSelected = companyQuote.quoteId === selectedQuoteDetail.quoteId;
                          const isExpanded = expandedCompanyQuote === companyQuote.quoteId;
                          const snapshot = companyQuote.calculationSnapshot;

                          return (
                            <div
                              key={companyQuote.quoteId}
                              className={`rounded-2xl border overflow-hidden transition-all ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              {/* Quote Header */}
                              <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-black text-slate-800">{companyQuote.quoteId}</span>
                                    {isSelected && (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white">
                                        CUSTOMER SELECTED
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm font-black text-slate-800">
                                    {companyQuote.currency} {companyQuote.tariffAmount?.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-500">
                                  <span className="font-bold">{companyQuote.companyName}</span>
                                  <span>{companyQuote.originCode} → {companyQuote.destinationCode}</span>
                                </div>
                              </div>

                              {/* Calculation Panel */}
                              {snapshot && (
                                <div className="border-t border-slate-100">
                                  <button
                                    onClick={() => setExpandedCompanyQuote(isExpanded ? null : companyQuote.quoteId)}
                                    className="w-full flex items-center justify-between p-2.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                  >
                                    <span>Calculation Breakdown</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>
                                  {isExpanded && (
                                    <div className="px-3 pb-3 space-y-0.5">
                                      <CalcRow label="Base Freight" value={`₹${snapshot.baseFreight.toLocaleString()}`} />
                                      <CalcRow label="BAF" value={`₹${snapshot.bafFuelSurcharge.toLocaleString()}`} />
                                      <CalcRow label="Origin THC" value={`₹${snapshot.originThc.toLocaleString()}`} />
                                      <CalcRow label="Documentation" value={`₹${snapshot.documentationFee.toLocaleString()}`} />
                                      {snapshot.specialHandling > 0 && <CalcRow label="Special Handling" value={`₹${snapshot.specialHandling.toLocaleString()}`} />}
                                      {snapshot.insuranceFee > 0 && <CalcRow label="Insurance" value={`₹${snapshot.insuranceFee.toLocaleString()}`} />}
                                      {snapshot.discountAmount > 0 && <CalcRow label="Discount" value={`-₹${snapshot.discountAmount.toLocaleString()}`} color="text-emerald-600" />}
                                      <div className="border-t border-slate-200 my-1" />
                                      <CalcRow label="Total Cost" value={`₹${snapshot.totalCost.toLocaleString()}`} bold />
                                      <CalcRow label="Margin" value={`${snapshot.marginPercentage}% (₹${snapshot.marginAmount.toLocaleString()})`} />
                                      <div className="border-t border-slate-200 my-1" />
                                      <CalcRow label="Final Price" value={`₹${snapshot.finalSellPrice.toLocaleString()}`} bold color="text-blue-700" />
                                      <div className="mt-2 pt-2 border-t border-slate-100">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Route: {snapshot.routeDetails.distance} · {snapshot.routeDetails.transitDays} transit</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action */}
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-3">Review the quote details above, then start the verification process.</p>
                    <button
                      onClick={() => {
                        handleSelectedQuoteAction(selectedQuoteDetail.selectedQuoteId, 'UNDER_REVIEW');
                        setSelectedQuoteDetail({ ...selectedQuoteDetail, status: 'UNDER_REVIEW' });
                      }}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Start Review
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                {/* Request Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-slate-900">{selectedRequest.requestId}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedRequest.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : selectedRequest.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {selectedRequest.status.replace('_', ' ')}
                        </span>
                        {selectedRequest.resubmissionCount ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            RESUBMITTED ({selectedRequest.resubmissionCount}x)
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500">
                        Customer: {selectedRequest.customerId} | Quote: {selectedRequest.quoteId}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">
                        {selectedRequest.quoteSnapshot.companyName || 'FreightHub'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipment Details */}
                <div className="p-5 border-b border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Shipment Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Route</span>
                      <p className="font-bold text-slate-800">
                        {selectedRequest.quoteSnapshot.originCode} →{' '}
                        {selectedRequest.quoteSnapshot.destinationCode}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Mode</span>
                      <p className="font-bold text-slate-800 uppercase">
                        {selectedRequest.quoteSnapshot.transportMode}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Cargo</span>
                      <p className="font-bold text-slate-800">
                        {selectedRequest.quoteSnapshot.cargoSummary}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Price</span>
                      <p className="font-black text-blue-700">
                        {selectedRequest.quoteSnapshot.currency || 'USD'}{' '}
                        {selectedRequest.quoteSnapshot.tariffAmount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document Statistics */}
                <div className="p-5 border-b border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Document Statistics
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    {(() => {
                      const stats = getDocumentStats();
                      return (
                        <>
                          <div className="text-center p-3 bg-slate-50 rounded-xl">
                            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
                            <p className="text-[10px] text-slate-500 font-bold">Total</p>
                          </div>
                          <div className="text-center p-3 bg-emerald-50 rounded-xl">
                            <p className="text-2xl font-black text-emerald-600">{stats.verified}</p>
                            <p className="text-[10px] text-emerald-600 font-bold">Verified</p>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-xl">
                            <p className="text-2xl font-black text-blue-600">{stats.pending}</p>
                            <p className="text-[10px] text-blue-600 font-bold">Pending</p>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-xl">
                            <p className="text-2xl font-black text-red-600">{stats.missing}</p>
                            <p className="text-[10px] text-red-600 font-bold">Missing</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Resubmission History */}
                {selectedRequest.rejectionHistory && selectedRequest.rejectionHistory.length > 0 && (
                  <div className="p-5 border-b border-slate-100 bg-amber-50">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-3">
                      Resubmission History ({selectedRequest.rejectionHistory.length} rejection{selectedRequest.rejectionHistory.length > 1 ? 's' : ''})
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
                        Last resubmitted: {new Date(selectedRequest.lastResubmittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} at{' '}
                        {new Date(selectedRequest.lastResubmittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                )}

                {/* Document Checklist */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Document Checklist
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500">
                      {checklist?.requiredDocuments?.filter((d: DocumentChecklistItem) => d.status === 'VERIFIED').length || 0} /{' '}
                      {checklist?.requiredDocuments?.length || 0} Verified
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {checklist?.requiredDocuments?.map((item: DocumentChecklistItem) => (
                      <div
                        key={item.documentType}
                        className={`p-3 rounded-xl border ${
                          item.status === 'VERIFIED'
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">
                            {DOCUMENT_TYPE_LABELS[item.documentType]}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleChecklistUpdate(item.documentType, 'VERIFIED')}
                            disabled={item.status === 'VERIFIED' || actionLoading}
                            className={`flex-1 text-[10px] font-bold px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 ${
                              item.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-600 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            Verify
                          </button>
                          <button
                            onClick={() => handleChecklistUpdate(item.documentType, 'MISSING')}
                            disabled={item.status === 'MISSING' || actionLoading}
                            className={`flex-1 text-[10px] font-bold px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 ${
                              item.status === 'MISSING'
                                ? 'bg-red-100 text-red-600 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-500 text-white'
                            }`}
                          >
                            <X className="w-3 h-3" />
                            Missing
                          </button>
                        </div>
                      </div>
                    )) || (
                      <div className="col-span-3 text-center py-4 text-xs text-slate-500">
                        No checklist available. Click "Create Checklist" to start.
                      </div>
                    )}
                  </div>
                  {!checklist && selectedRequest && (
                    <button
                      onClick={() => createChecklist(selectedRequest.requestId)}
                      className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs"
                    >
                      Create Checklist
                    </button>
                  )}
                </div>

                {/* Documents List */}
                <div className="p-5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Uploaded Documents
                  </h4>
                  {documents.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No documents uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div
                          key={doc.documentId}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-slate-400" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {doc.fileName || DOCUMENT_TYPE_LABELS[doc.documentType]}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {DOCUMENT_TYPE_LABELS[doc.documentType]} • Version {doc.version}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(doc.status)}
                              <button
                                onClick={() =>
                                  setExpandedDoc(expandedDoc === doc.documentId ? null : doc.documentId)
                                }
                                className="p-1 text-slate-400 hover:text-slate-600"
                              >
                                {expandedDoc === doc.documentId ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Details & Actions */}
                          {expandedDoc === doc.documentId && (
                            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                              {doc.remarks && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                  <p className="text-[10px] font-bold text-amber-800 uppercase mb-1">Remarks</p>
                                  <p className="text-xs text-amber-700">{doc.remarks}</p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-slate-400">Document ID</span>
                                  <p className="font-mono font-medium text-slate-700">{doc.documentId}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400">File Size</span>
                                  <p className="font-medium text-slate-700">
                                    {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
                                  </p>
                                </div>
                              </div>

                              {/* Agent Actions */}
                              {doc.status !== 'VERIFIED' && doc.status !== 'REJECTED' && (
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                                      Review Remarks
                                    </label>
                                    <input
                                      type="text"
                                      value={verifyRemarks[doc.documentId] || ''}
                                      onChange={(e) =>
                                        setVerifyRemarks({
                                          ...verifyRemarks,
                                          [doc.documentId]: e.target.value,
                                        })
                                      }
                                      placeholder="Add remarks (required for rejection)..."
                                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleVerifyDocument(doc.documentId)}
                                      disabled={actionLoading}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                                    >
                                      {actionLoading ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      )}
                                      Verify
                                    </button>
                                    <button
                                      onClick={() => handleRejectDocument(doc.documentId)}
                                      disabled={actionLoading || !verifyRemarks[doc.documentId]}
                                      className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedRequest.status !== 'APPROVED' && selectedRequest.status !== 'REJECTED' && (
                  <div className="p-5 bg-slate-50 border-t border-slate-200">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setRequestInfoModal(true)}
                        disabled={actionLoading}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Request Information
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Information Modal */}
      {requestInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Request Information</h3>
              <button
                onClick={() => {
                  setRequestInfoModal(false);
                  setRequestInfoText('');
                  setSelectedDocTypes([]);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Select the document types you need from the customer and add any additional remarks.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Required Documents</label>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, label]) => (
                <label
                  key={type}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedDocTypes.includes(type as DocumentType)
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDocTypes.includes(type as DocumentType)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDocTypes([...selectedDocTypes, type as DocumentType]);
                      } else {
                        setSelectedDocTypes(selectedDocTypes.filter((t) => t !== type));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-700">{label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Additional Remarks</label>
              <textarea
                value={requestInfoText}
                onChange={(e) => setRequestInfoText(e.target.value)}
                placeholder="Enter any additional instructions or remarks..."
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRequestInfoModal(false);
                  setRequestInfoText('');
                  setSelectedDocTypes([]);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestDocuments}
                disabled={selectedDocTypes.length === 0 || actionLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CalcRow: React.FC<{ label: string; value: string; bold?: boolean; color?: string }> = ({ label, value, bold, color }) => (
  <div className="flex items-center justify-between py-0.5">
    <span className="text-[10px] text-slate-400 font-bold uppercase">{label}</span>
    <span className={`text-[11px] ${bold ? 'font-black' : 'font-bold'} ${color || 'text-slate-700'}`}>{value}</span>
  </div>
);
