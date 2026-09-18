import React, { useEffect, useState, useCallback } from 'react';
import {
  Shield,
  AlertCircle,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  File,
  Image,
  Eye,
  ChevronDown,
  ChevronUp,
  Radar,
  Edit,
} from 'lucide-react';
import { SavedQuotation, CurrencyCode, CalculationSnapshot, VerificationRequest } from '../types';
import { QuotePDFModal } from './QuotePDFModal';

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

interface M4SelectedQuotesViewProps {
  userEmail: string;
  onNavigateToTracking?: () => void;
  onEditQuote?: (quoteId: string) => void;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  SELECTED: { color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200', label: 'SELECTED' },
  UNDER_REVIEW: { color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200', label: 'UNDER REVIEW' },
  CUSTOMS_APPROVED: { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', label: 'BOOKED' },
  APPROVED: { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', label: 'APPROVED' },
  BOOKED: { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', label: 'BOOKED' },
  REJECTED: { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200', label: 'REJECTED' },
};

const getTransportLabel = (mode: string): string => {
  switch ((mode || '').toLowerCase()) {
    case 'ocean': return 'OCEAN';
    case 'air': return 'AIR';
    case 'ground': return 'GROUND';
    case 'express': return 'EXPRESS';
    default: return (mode || 'FREIGHT').toUpperCase();
  }
};

const safeFormatDate = (ts: string | null | undefined): string => {
  if (!ts) return 'N/A';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ' \u2022 ' + d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

export const M4SelectedQuotesView: React.FC<M4SelectedQuotesViewProps> = ({ userEmail, onNavigateToTracking, onEditQuote }) => {
  const [selectedQuotes, setSelectedQuotes] = useState<SelectedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfPreviewQuote, setPdfPreviewQuote] = useState<SavedQuotation | null>(null);
  const [quoteDocuments, setQuoteDocuments] = useState<Record<string, any[]>>({});
  const [uploadingQuoteId, setUploadingQuoteId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [verificationRequests, setVerificationRequests] = useState<Record<string, VerificationRequest>>({});
  const [resubmitQuoteId, setResubmitQuoteId] = useState<string | null>(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState<string | null>(null);

  const fetchSelectedQuotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch('/api/selected-quotes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSelectedQuotes(result.data || []);
      } else {
        setSelectedQuotes([]);
      }
    } catch {
      setSelectedQuotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = useCallback(async (selectedQuoteId: string) => {
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch(`/api/selected-quotes/${selectedQuoteId}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setQuoteDocuments(prev => ({ ...prev, [selectedQuoteId]: result.data || [] }));
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchVerificationRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch('/api/verifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.success && Array.isArray(result.data)) {
        const vrMap: Record<string, VerificationRequest> = {};
        for (const vr of result.data) {
          vrMap[vr.quoteId] = vr;
        }
        setVerificationRequests(vrMap);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDocumentUpload = async (selectedQuoteId: string, file: File) => {
    setUploadingQuoteId(selectedQuoteId);
    setUploadSuccess(null);
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';

      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const uploadResult = await uploadRes.json();

      const fileUrl = uploadResult.fileUrl || '';
      const fileName = file.name;
      const fileSize = file.size;
      const mimeType = file.type;

      let documentType = 'OTHER';
      if (mimeType.includes('pdf')) documentType = 'COMMERCIAL_INVOICE';
      else if (mimeType.includes('image')) documentType = 'PACKING_LIST';

      const response = await fetch(`/api/selected-quotes/${selectedQuoteId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ documentType, fileName, fileUrl, fileSize, mimeType }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setUploadSuccess(`"${fileName}" uploaded successfully`);
        fetchDocuments(selectedQuoteId);
        setTimeout(() => setUploadSuccess(null), 3000);
      }
    } catch {
      setError('Failed to upload document');
    } finally {
      setUploadingQuoteId(null);
    }
  };

  const handleResubmit = async (quoteId: string) => {
    const vr = verificationRequests[quoteId];
    if (!vr) return;

    setResubmitLoading(true);
    setResubmitSuccess(null);
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch(`/api/verifications/${vr.requestId}/resubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setResubmitSuccess(quoteId);
        setResubmitQuoteId(null);
        await fetchSelectedQuotes();
        await fetchVerificationRequests();
      } else {
        setError(result.error || 'Failed to resubmit');
      }
    } catch {
      setError('Failed to resubmit. Please try again.');
    } finally {
      setResubmitLoading(false);
    }
  };

  const handleShowPDFPreview = async (item: SelectedQuote) => {
    try {
      const savedQuotations = JSON.parse(localStorage.getItem('freighthub_quotations') || '[]');
      const fullQuote = savedQuotations.find((q: SavedQuotation) => q.id === item.quoteId);
      if (fullQuote) {
        setPdfPreviewQuote(fullQuote);
      } else {
        const minimalQuote: SavedQuotation = {
          id: item.quoteId,
          status: item.status as any,
          shipperName: '',
          companyName: item.companyName,
          companyId: item.companyId,
          routeSummary: `${item.originCode} → ${item.destinationCode}`,
          originCode: item.originCode,
          destinationCode: item.destinationCode,
          transportMode: item.transportMode as any,
          tariffAmount: item.tariffAmount,
          currency: item.currency as CurrencyCode,
          shipperEmail: item.shipperEmail,
          cargoSummary: '',
          breakdown: {
            currency: item.currency as CurrencyCode,
            baseTariff: item.tariffAmount,
            baseRatePerUnit: item.tariffAmount,
            bafFuelSurcharge: 0,
            terminalHandlingCharge: 0,
            documentationFee: 0,
            specialHandlingSurcharge: 0,
            insuranceFee: 0,
            discountAmount: 0,
            subtotal: item.tariffAmount,
            estimatedTax: 0,
            grandTotal: item.tariffAmount,
            chargeBasis: 'per shipment',
            cargoCountSummary: '1 shipment',
            totalWeightKg: 0,
            estimatedDistanceNmOrKm: 'N/A',
            estimatedTransitDays: 'N/A',
            estimatedArrivalDate: 'N/A',
          },
          formData: {
            originPort: item.originCode,
            destinationPort: item.destinationCode,
          } as any,
          version: 1,
          createdAt: item.createdAt,
        };
        setPdfPreviewQuote(minimalQuote);
      }
    } catch {
      const minimalQuote: SavedQuotation = {
        id: item.quoteId,
        status: item.status as any,
        shipperName: '',
        companyName: item.companyName,
        companyId: item.companyId,
        routeSummary: `${item.originCode} → ${item.destinationCode}`,
        originCode: item.originCode,
        destinationCode: item.destinationCode,
        transportMode: item.transportMode as any,
        tariffAmount: item.tariffAmount,
        currency: item.currency as CurrencyCode,
        shipperEmail: item.shipperEmail,
        cargoSummary: '',
        breakdown: {
          currency: item.currency as CurrencyCode,
          baseTariff: item.tariffAmount,
          baseRatePerUnit: item.tariffAmount,
          bafFuelSurcharge: 0,
          terminalHandlingCharge: 0,
          documentationFee: 0,
          specialHandlingSurcharge: 0,
          insuranceFee: 0,
          discountAmount: 0,
          subtotal: item.tariffAmount,
          estimatedTax: 0,
          grandTotal: item.tariffAmount,
          chargeBasis: 'per shipment',
          cargoCountSummary: '1 shipment',
          totalWeightKg: 0,
          estimatedDistanceNmOrKm: 'N/A',
          estimatedTransitDays: 'N/A',
          estimatedArrivalDate: 'N/A',
        },
        formData: {} as any,
        version: 1,
        createdAt: item.createdAt,
      };
      setPdfPreviewQuote(minimalQuote);
    }
  };

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const getCalculationSnapshot = useCallback((quoteId: string): CalculationSnapshot | null => {
    try {
      const saved = localStorage.getItem('freighthub_quotations');
      if (!saved) return null;
      const quotes: SavedQuotation[] = JSON.parse(saved);
      const match = quotes.find((q) => q.id === quoteId);
      return match?.calculationSnapshot || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchSelectedQuotes();
    fetchVerificationRequests();
  }, []);

  useEffect(() => {
    if (selectedQuotes.length > 0) {
      selectedQuotes.forEach(item => fetchDocuments(item.selectedQuoteId));
    }
  }, [selectedQuotes, fetchDocuments]);

  const sortedQuotes = [...selectedQuotes].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt).getTime();
    return dateB - dateA;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-slate-500">Loading selected quotes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-base font-black text-slate-900">My Selected Quotes</h3>
          <p className="text-xs text-slate-500">Track the status of your selected freight quotes.</p>
        </div>
        <button onClick={fetchSelectedQuotes} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {selectedQuotes.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No Selections Yet</h4>
          <p className="text-xs text-slate-400">Head to Compare Quotes to select a rate proposal.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedQuotes.map((item) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.SELECTED;
            const isExpanded = expandedId === item.selectedQuoteId;
            const docs = quoteDocuments[item.selectedQuoteId] || [];

            return (
              <div
                key={item.selectedQuoteId}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300"
              >
                {/* Collapsed Card - Always Visible */}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.selectedQuoteId)}
                  className="w-full text-left p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Company + ID + Route/Mode/Price */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="font-black text-xs text-slate-900 truncate">{item.companyName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-2 truncate">
                        {item.selectedQuoteId}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-bold text-slate-800">
                          {item.originCode} → {item.destinationCode}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {getTransportLabel(item.transportMode)}
                        </span>
                        <span className="font-black text-slate-700">
                          {item.currency} {item.tariffAmount?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Right: Status + Expand Icon */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'REJECTED' && onEditQuote && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditQuote(item.quoteId);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 font-bold text-[10px] rounded-full transition-colors shadow-sm"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                      )}
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/30">
                    {/* Quote Details */}
                    <Section title="Quote Details">
                      <DetailRow label="Quote ID" value={item.quoteId} />
                      <DetailRow label="Company" value={item.companyName} />
                      <DetailRow label="Route" value={`${item.originCode} → ${item.destinationCode}`} />
                      <DetailRow label="Transport Mode" value={getTransportLabel(item.transportMode)} />
                      <DetailRow label="Price" value={`${item.currency} ${item.tariffAmount?.toLocaleString()}`} />
                    </Section>

                    {/* Selection Information */}
                    <Section title="Selection Information">
                      <DetailRow label="Selected At" value={safeFormatDate(item.createdAt)} />
                      <DetailRow label="Selection ID" value={item.selectedQuoteId} />
                    </Section>

                    {/* Verification Status */}
                    <Section title="Verification Status">
                      <DetailRow
                        label="Agent Review"
                        value={
                          item.status === 'UNDER_REVIEW' ? 'In Progress' :
                          item.status === 'APPROVED' || item.status === 'CUSTOMS_APPROVED' || item.status === 'BOOKED' ? 'Completed' :
                          item.status === 'REJECTED' ? 'Rejected' :
                          'Pending'
                        }
                        valueColor={
                          item.status === 'UNDER_REVIEW' ? 'text-purple-600' :
                          (item.status === 'APPROVED' || item.status === 'CUSTOMS_APPROVED' || item.status === 'BOOKED') ? 'text-emerald-600' :
                          item.status === 'REJECTED' ? 'text-red-600' :
                          'text-slate-500'
                        }
                      />
                      {item.reviewedBy && (
                        <DetailRow label="Reviewed By" value={item.reviewedBy} />
                      )}
                      {item.reviewedAt && (
                        <DetailRow label="Reviewed At" value={safeFormatDate(item.reviewedAt)} />
                      )}
                      <DetailRow
                        label="Customs Review"
                        value={
                          item.status === 'CUSTOMS_APPROVED' ? 'Approved' :
                          (item.status === 'APPROVED' || item.status === 'BOOKED') ? 'Pending' :
                          'Pending'
                        }
                      />
                    </Section>

                    {/* Proof Documents */}
                    {(item.status === 'SELECTED' || item.status === 'UNDER_REVIEW') && (
                      <Section title="Customer Proof Documents">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Upload Documents</span>
                          <label className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-500 cursor-pointer">
                            <Upload className="w-3 h-3" />
                            <span>{uploadingQuoteId === item.selectedQuoteId ? 'Uploading...' : 'Upload'}</span>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              disabled={uploadingQuoteId === item.selectedQuoteId}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDocumentUpload(item.selectedQuoteId, file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                        {uploadSuccess && (
                          <div className="flex items-center gap-1 p-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold mb-2">
                            <CheckCircle2 className="w-3 h-3" /> {uploadSuccess}
                          </div>
                        )}
                        {docs.length > 0 ? (
                          <div className="space-y-1.5">
                            {docs.map((doc) => (
                              <div key={doc.docId} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
                                {doc.mimeType?.includes('image') ? <Image className="w-4 h-4 text-blue-500" /> : <File className="w-4 h-4 text-red-500" />}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-medium text-slate-800 truncate">{doc.fileName}</p>
                                  <p className="text-[9px] text-slate-400">{(doc.fileSize / 1024).toFixed(1)} KB</p>
                                </div>
                                {doc.fileUrl && (
                                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-600 hover:text-blue-500">
                                    <Eye className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">No documents uploaded yet. Upload invoice, packing list, etc.</p>
                        )}
                      </Section>
                    )}

                    {/* Uploaded Documents for non-selected/under-review */}
                    {(item.status !== 'SELECTED' && item.status !== 'UNDER_REVIEW') && docs.length > 0 && (
                      <Section title="Uploaded Documents">
                        <div className="space-y-1.5">
                          {docs.map((doc) => (
                            <div key={doc.docId} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
                              {doc.mimeType?.includes('image') ? <Image className="w-4 h-4 text-blue-500" /> : <File className="w-4 h-4 text-red-500" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-slate-800 truncate">{doc.fileName}</p>
                              </div>
                              {doc.fileUrl && (
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-600 hover:text-blue-500">
                                  <Eye className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}

                    {/* Rejection Details */}
                    {item.status === 'REJECTED' && (() => {
                      const vr = verificationRequests[item.quoteId];
                      const rejectionReason = vr?.rejectionReason || item.agentRemarks;
                      const rejectedBy = vr?.rejectedBy;
                      const rejectedAt = vr?.rejectedAt;
                      return rejectionReason ? (
                        <Section title="Rejection Details">
                          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center gap-1.5 mb-1">
                              <XCircle className="w-3 h-3 text-red-500" />
                              <p className="text-[10px] text-red-600 font-bold uppercase">
                                Rejected by {vr?.rejectionHistory?.[vr.rejectionHistory.length - 1]?.role === 'customs-officer' ? 'Customs Officer' : 'Freight Agent'}
                              </p>
                            </div>
                            <p className="text-[11px] text-red-700">{rejectionReason}</p>
                            {rejectedAt && (
                              <p className="text-[9px] text-red-500 mt-1">{safeFormatDate(rejectedAt)}</p>
                            )}
                          </div>
                        </Section>
                      ) : null;
                    })()}

                    {/* Resubmission Success Message */}
                    {resubmitSuccess === item.quoteId && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <p className="text-[11px] text-emerald-700 font-medium">
                          Documents resubmitted successfully. The request is now pending agent review.
                        </p>
                      </div>
                    )}

                    {/* Agent Remarks (for approved/booked) */}
                    {item.agentRemarks && item.status !== 'REJECTED' && (
                      <Section title="Agent Remarks">
                        <p className="text-[11px] text-slate-600">{item.agentRemarks}</p>
                      </Section>
                    )}

                    {/* Calculation Breakdown */}
                    {(() => {
                      const snapshot = getCalculationSnapshot(item.quoteId);
                      if (!snapshot) return null;
                      return (
                        <Section title="Calculation Breakdown">
                          <div className="space-y-0.5">
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
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Route: {snapshot.routeDetails.distance} · {snapshot.routeDetails.transitDays} transit</p>
                          </div>
                        </Section>
                      );
                    })()}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      {/* Edit & Resubmit button - ONLY for REJECTED status */}
                      {item.status === 'REJECTED' && verificationRequests[item.quoteId] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setResubmitQuoteId(resubmitQuoteId === item.quoteId ? null : item.quoteId);
                          }}
                          disabled={resubmitLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] rounded-lg transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className="w-3 h-3" /> Edit & Resubmit
                        </button>
                      )}

                      {(item.status === 'APPROVED' || item.status === 'CUSTOMS_APPROVED' || item.status === 'BOOKED') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowPDFPreview(item);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg transition-colors"
                        >
                          <Download className="w-3 h-3" /> Download Quote
                        </button>
                      )}
                      {onNavigateToTracking && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToTracking();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 font-bold text-[10px] rounded-lg transition-colors"
                        >
                          <Radar className="w-3 h-3" /> View Tracking
                        </button>
                      )}
                    </div>

                    {/* Resubmit Confirmation Panel */}
                    {resubmitQuoteId === item.quoteId && item.status === 'REJECTED' && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <RefreshCw className="w-4 h-4 text-amber-600" />
                          <h4 className="text-[11px] font-bold text-amber-800">Correct & Resubmit Documents</h4>
                        </div>
                        <p className="text-[10px] text-amber-700 mb-3">
                          Your quotation was rejected by the Customs Officer. Please correct the requested items and resubmit for verification. The same quotation will be sent through Agent Review and Customs Officer Review again.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResubmit(item.quoteId);
                            }}
                            disabled={resubmitLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] rounded-lg transition-colors disabled:opacity-50"
                          >
                            {resubmitLoading ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            {resubmitLoading ? 'Resubmitting...' : 'Confirm Resubmit'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setResubmitQuoteId(null);
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-bold text-[10px] rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PDF Preview Modal */}
      <QuotePDFModal
        quote={pdfPreviewQuote}
        onClose={() => setPdfPreviewQuote(null)}
      />
    </div>
  );
};

/* ================================================================
   Reusable sub-components
   ================================================================ */

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{title}</h4>
    <div className="space-y-1.5">
      {children}
    </div>
  </div>
);

const DetailRow: React.FC<{ label: string; value: string; valueColor?: string }> = ({ label, value, valueColor }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-[10px] text-slate-400 font-bold uppercase">{label}</span>
    <span className={`text-[11px] font-bold ${valueColor || 'text-slate-700'}`}>{value}</span>
  </div>
);

const CalcRow: React.FC<{ label: string; value: string; bold?: boolean; color?: string }> = ({ label, value, bold, color }) => (
  <div className="flex items-center justify-between py-0.5">
    <span className="text-[10px] text-slate-400 font-bold uppercase">{label}</span>
    <span className={`text-[11px] ${bold ? 'font-black' : 'font-bold'} ${color || 'text-slate-700'}`}>{value}</span>
  </div>
);
