import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  Trash2,
  Plus,
  Filter,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  File,
  Image,
  FileSpreadsheet
} from 'lucide-react';
import { DocumentRecord, VerificationRequest, DocumentType, DocumentStatus } from '../types';

interface M4CustomerDocumentsViewProps {
  userEmail: string;
  userId: string;
}

interface DocumentWithType extends DocumentRecord {
  displayName?: string;
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
  UPLOADED: { color: 'text-blue-700', bg: 'bg-blue-100', icon: <Upload className="w-3.5 h-3.5" /> },
  UNDER_REVIEW: { color: 'text-purple-700', bg: 'bg-purple-100', icon: <Eye className="w-3.5 h-3.5" /> },
  VERIFIED: { color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  REJECTED: { color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="w-3.5 h-3.5" /> },
  MISSING: { color: 'text-red-700', bg: 'bg-red-100', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

const FILE_ICON_MAP: Record<string, React.ReactNode> = {
  'application/pdf': <File className="w-5 h-5 text-red-500" />,
  'image/jpeg': <Image className="w-5 h-5 text-blue-500" />,
  'image/png': <Image className="w-5 h-5 text-blue-500" />,
  'application/vnd.ms-excel': <FileSpreadsheet className="w-5 h-5 text-green-500" />,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': <FileSpreadsheet className="w-5 h-5 text-green-500" />,
};

export const M4CustomerDocumentsView: React.FC<M4CustomerDocumentsViewProps> = ({
  userEmail,
  userId,
}) => {
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [documents, setDocuments] = useState<DocumentWithType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocType, setUploadingDocType] = useState<DocumentType | null>(null);

  // Fetch verification requests
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
        throw new Error(result.error || 'Failed to load verification requests');
      }
      setVerificationRequests(result.data || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
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

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      fetchDocuments(selectedRequest.requestId);
    }
  }, [selectedRequest]);

  // Handle file upload
  const handleFileUpload = async (file: File, documentType: DocumentType, existingDocumentId?: string) => {
    if (!selectedRequest) return;

    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('freighthub_session_token') || '';

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // First upload the file to get a reference
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      let fileReference = `ref_${Date.now()}`;
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        fileReference = uploadResult.fileReference || fileReference;
      }

      // Then create the document record
      const response = await fetch('/api/m4/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: selectedRequest.requestId,
          documentType,
          fileName: file.name,
          fileReference,
          fileSize: file.size,
          mimeType: file.type,
          existingDocumentId,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload document');
      }

      setSuccessMsg(`Document uploaded successfully (Version ${result.data.version})`);
      fetchDocuments(selectedRequest.requestId);
      setUploadingDocType(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, documentType: DocumentType, existingDocumentId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        setError('Unsupported file type. Please upload PDF, JPEG, PNG, or Word documents.');
        return;
      }

      handleFileUpload(file, documentType, existingDocumentId);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    return FILE_ICON_MAP[mimeType] || <File className="w-5 h-5 text-slate-400" />;
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesStatus = filterStatus === 'ALL' || doc.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      DOCUMENT_TYPE_LABELS[doc.documentType]?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Get required documents that are missing or requested
  const getRequiredDocuments = () => {
    const requiredTypes: DocumentType[] = ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'CUSTOMS_DOCUMENT'];
    return requiredTypes.map((type) => {
      const existingDoc = documents.find((d) => d.documentType === type);
      return {
        type,
        label: DOCUMENT_TYPE_LABELS[type],
        document: existingDoc,
        status: existingDoc?.status || 'MISSING',
      };
    });
  };

  // Get active verification requests (not approved/rejected)
  const activeRequests = verificationRequests.filter(
    (r) => r.status !== 'APPROVED' && r.status !== 'REJECTED'
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading your documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Document Management</h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload and manage documents for your shipment verifications.
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
      {activeRequests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-700">No Active Verifications</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            You don't have any active verification requests. Select a quote to start the verification process.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Verification Requests */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-blue-600" />
                Verification Requests
              </h3>

              <div className="space-y-2">
                {activeRequests.map((req) => (
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
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          req.status === 'PENDING'
                            ? 'bg-slate-200 text-slate-800'
                            : req.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : req.status === 'INFO_REQUESTED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">
                      {req.quoteSnapshot.originCode} → {req.quoteSnapshot.destinationCode}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {req.quoteSnapshot.companyName || 'FreightHub'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content - Documents */}
          <div className="lg:col-span-8">
            {!selectedRequest ? (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-3 h-full min-h-[400px]">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-600">Select a verification request</p>
                  <p className="text-xs text-slate-400">
                    Choose a verification request from the sidebar to manage documents.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                {/* Request Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {selectedRequest.requestId}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedRequest.quoteSnapshot.originCode} →{' '}
                        {selectedRequest.quoteSnapshot.destinationCode} |{' '}
                        {selectedRequest.quoteSnapshot.companyName || 'FreightHub'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        selectedRequest.status === 'INFO_REQUESTED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {selectedRequest.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Required Documents Checklist */}
                <div className="p-5 border-b border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Required Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {getRequiredDocuments().map((reqDoc) => (
                      <div
                        key={reqDoc.type}
                        className={`p-3 rounded-xl border ${
                          reqDoc.status === 'VERIFIED'
                            ? 'bg-emerald-50 border-emerald-200'
                            : reqDoc.status === 'UPLOADED' || reqDoc.status === 'UNDER_REVIEW'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">{reqDoc.label}</span>
                          {getStatusBadge(reqDoc.status as DocumentStatus)}
                        </div>
                        {reqDoc.status === 'MISSING' && (
                          <button
                            onClick={() => {
                              setUploadingDocType(reqDoc.type);
                              fileInputRef.current?.click();
                            }}
                            disabled={isUploading}
                            className="w-full mt-2 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            Upload
                          </button>
                        )}
                        {(reqDoc.status === 'UPLOADED' || reqDoc.status === 'UNDER_REVIEW') && reqDoc.document && (
                          <button
                            onClick={() => {
                              setUploadingDocType(reqDoc.type);
                              fileInputRef.current?.click();
                            }}
                            disabled={isUploading}
                            className="w-full mt-2 text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            Replace
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filters */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as DocumentStatus | 'ALL')}
                        className="appearance-none w-full md:w-40 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8"
                      >
                        <option value="ALL">All Status</option>
                        <option value="REQUESTED">Requested</option>
                        <option value="UPLOADED">Uploaded</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="MISSING">Missing</option>
                      </select>
                      <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Documents List */}
                <div className="p-5">
                  {filteredDocuments.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-600">No documents found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {documents.length === 0
                          ? 'Upload your first document using the buttons above.'
                          : 'Try adjusting your search or filter criteria.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredDocuments.map((doc) => (
                        <div
                          key={doc.documentId}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                                {getFileIcon(doc.mimeType)}
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

                          {/* Expanded Details */}
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
                                {doc.reviewedBy && (
                                  <div>
                                    <span className="text-slate-400">Reviewed By</span>
                                    <p className="font-medium text-slate-700">{doc.reviewedBy}</p>
                                  </div>
                                )}
                                {doc.reviewedAt && (
                                  <div>
                                    <span className="text-slate-400">Reviewed At</span>
                                    <p className="font-medium text-slate-700">
                                      {new Date(doc.reviewedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setUploadingDocType(doc.documentType);
                                    fileInputRef.current?.click();
                                  }}
                                  disabled={isUploading}
                                  className="flex-1 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  Replace Document
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="p-5 bg-slate-50 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setUploadingDocType(null);
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Upload New Document
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={(e) => handleFileInputChange(e, uploadingDocType || 'OTHER')}
      />
    </div>
  );
};
