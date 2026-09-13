import React, { useEffect, useState } from 'react';
import { Shield, AlertCircle, FileText, CheckCircle2, Clock, XCircle, RefreshCw, Download, X, Upload, File, Image, Eye } from 'lucide-react';
import { SavedQuotation, CurrencyCode } from '../types';
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
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  SELECTED: { color: 'text-blue-700', bg: 'bg-blue-100', label: 'SELECTED', icon: 'clock' },
  UNDER_REVIEW: { color: 'text-purple-700', bg: 'bg-purple-100', label: 'UNDER REVIEW', icon: 'eye' },
  CUSTOMS_APPROVED: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'BOOKED', icon: 'check' },
  APPROVED: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'APPROVED', icon: 'check' },
  BOOKED: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'BOOKED', icon: 'check' },
  REJECTED: { color: 'text-red-700', bg: 'bg-red-100', label: 'REJECTED', icon: 'x' },
};

export const M4SelectedQuotesView: React.FC<M4SelectedQuotesViewProps> = ({ userEmail }) => {
  const [selectedQuotes, setSelectedQuotes] = useState<SelectedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfPreviewQuote, setPdfPreviewQuote] = useState<SavedQuotation | null>(null);
  const [quoteDocuments, setQuoteDocuments] = useState<Record<string, any[]>>({});
  const [uploadingQuoteId, setUploadingQuoteId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

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

  const fetchDocuments = async (selectedQuoteId: string) => {
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
  };

  const handleDocumentUpload = async (selectedQuoteId: string, file: File) => {
    setUploadingQuoteId(selectedQuoteId);
    setUploadSuccess(null);
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';

      // Upload file to server
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

      // Determine doc type from extension
      let documentType = 'OTHER';
      if (mimeType.includes('pdf')) documentType = 'COMMERCIAL_INVOICE';
      else if (mimeType.includes('image')) documentType = 'PACKING_LIST';

      // Save document record
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

  const handleShowPDFPreview = async (item: SelectedQuote) => {
    // Fetch the full quotation data from localStorage
    try {
      const savedQuotations = JSON.parse(localStorage.getItem('freighthub_quotations') || '[]');
      const fullQuote = savedQuotations.find((q: SavedQuotation) => q.id === item.quoteId);
      if (fullQuote) {
        setPdfPreviewQuote(fullQuote);
      } else {
        // Create a minimal SavedQuotation if not found
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
      // Fallback minimal quote
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

  useEffect(() => {
    fetchSelectedQuotes();
  }, []);

  useEffect(() => {
    if (selectedQuotes.length > 0) {
      selectedQuotes.forEach(item => fetchDocuments(item.selectedQuoteId));
    }
  }, [selectedQuotes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-slate-500">Loading selected quotes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-base font-black text-slate-900">My Selected Quotes</h3>
          <p className="text-xs text-slate-500">Track the status of your selected freight quotes.</p>
        </div>
        <button onClick={fetchSelectedQuotes} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedQuotes.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No Selections Yet</h4>
          <p className="text-xs text-slate-400">Head to Compare Quotes to select a rate proposal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedQuotes.map((item) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.SELECTED;
            return (
              <div key={item.selectedQuoteId} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-700" />
                      <span className="font-black text-xs text-slate-900">{item.companyName}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold block mt-0.5">ID: {item.selectedQuoteId}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Route</span>
                    <span className="font-medium text-slate-800">{item.originCode} → {item.destinationCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Mode</span>
                    <span className="font-medium text-slate-800 uppercase">{item.transportMode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Price</span>
                    <span className="font-black text-slate-700">{item.currency} {item.tariffAmount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Quote ID</span>
                    <span className="font-medium text-slate-800">{item.quoteId}</span>
                  </div>
                </div>

                {item.status === 'SELECTED' && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium">
                    <Clock className="w-4 h-4" /> Waiting for Freight Agent review...
                  </div>
                )}
                {item.status === 'UNDER_REVIEW' && (
                  <div className="flex items-center gap-2 p-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium">
                    <Clock className="w-4 h-4" /> Agent is reviewing your quote...
                  </div>
                )}
                {(item.status === 'APPROVED' || item.status === 'CUSTOMS_APPROVED') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" /> BOOKED - Ready to Download
                    </div>
                    {item.agentRemarks && (
                      <p className="text-[11px] text-emerald-600 px-2">{item.agentRemarks}</p>
                    )}
                    <button
                      onClick={() => handleShowPDFPreview(item)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] py-2 rounded-lg flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Download Quote
                    </button>
                  </div>
                )}
                {item.status === 'BOOKED' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" /> BOOKED - Ready to Download
                    </div>
                    <button
                      onClick={() => handleShowPDFPreview(item)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] py-2 rounded-lg flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Download Quote
                    </button>
                  </div>
                )}
                {item.status === 'REJECTED' && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold">
                      <XCircle className="w-4 h-4" /> Rejected
                    </div>
                    {item.agentRemarks && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-[10px] text-red-600 font-bold uppercase">Remarks:</p>
                        <p className="text-[11px] text-red-700">{item.agentRemarks}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Document Upload Section - show for SELECTED and UNDER_REVIEW */}
                {(item.status === 'SELECTED' || item.status === 'UNDER_REVIEW') && (
                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Proof Documents</span>
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
                      <div className="flex items-center gap-1 p-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> {uploadSuccess}
                      </div>
                    )}
                    {quoteDocuments[item.selectedQuoteId]?.length > 0 ? (
                      <div className="space-y-1.5">
                        {quoteDocuments[item.selectedQuoteId].map((doc) => (
                          <div key={doc.docId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
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
                  </div>
                )}

                {/* Show uploaded documents for other statuses */}
                {(item.status !== 'SELECTED' && item.status !== 'UNDER_REVIEW') && quoteDocuments[item.selectedQuoteId]?.length > 0 && (
                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Uploaded Documents</span>
                    <div className="space-y-1.5 mt-2">
                      {quoteDocuments[item.selectedQuoteId].map((doc) => (
                        <div key={doc.docId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Professional PDF Preview Modal */}
      <QuotePDFModal
        quote={pdfPreviewQuote}
        onClose={() => setPdfPreviewQuote(null)}
      />
    </div>
  );
};
