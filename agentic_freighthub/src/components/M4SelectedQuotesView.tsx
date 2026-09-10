import React, { useEffect, useState } from 'react';
import { VerificationRequest } from '../types';
import { Shield, AlertCircle, FileText, CheckCircle2, Clock, XCircle, FileQuestion, MessageSquare } from 'lucide-react';

interface M4SelectedQuotesViewProps {
  userEmail: string;
}

export const M4SelectedQuotesView: React.FC<M4SelectedQuotesViewProps> = ({ userEmail }) => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch('/api/verifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to load selected quotes.');
        return;
      }
      setRequests(result.data || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleAction = async (quoteId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch(`/api/quotes/${quoteId}/customer-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        alert(result.error || 'Action failed.');
        return;
      }
      fetchVerifications();
    } catch (err: any) {
      alert(err.message || 'An unexpected error occurred.');
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading selected quotes...</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900">My Selected Quotes</h3>
          <p className="text-xs text-slate-500">
            Track the verification progress of your selected quotes.
          </p>
        </div>
        <button
          onClick={fetchVerifications}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
        >
          Refresh Status
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No Selections Yet</h4>
          <p className="text-xs text-slate-400">Head to Compare Quotes to select a rate proposal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <div key={req.requestId} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-700" />
                    <span className="font-black text-xs text-slate-900">
                      {req.quoteSnapshot.companyName || 'FreightHub'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                    Request ID: {req.requestId}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                    req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    req.status === 'REVISION_ISSUED' ? 'bg-amber-100 text-amber-800' :
                    req.status === 'INFO_REQUESTED' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-200 text-slate-800'
                  }`}>
                    {req.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Selected Quote</span>
                  <span className="font-medium text-slate-800">{req.quoteId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Version</span>
                  <span className="font-medium text-slate-800">v{req.quoteSnapshot.version || 1}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Route</span>
                  <span className="font-medium text-slate-800">{req.quoteSnapshot.originCode} → {req.quoteSnapshot.destinationCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Price</span>
                  <span className="font-black text-slate-700">{req.quoteSnapshot.currency || 'USD'} {req.quoteSnapshot.tariffAmount?.toLocaleString() || '0'}</span>
                </div>
              </div>

              {req.status === 'REVISION_ISSUED' && req.revisedQuoteSnapshot && (
                <div className="grid grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t border-slate-200">
                  <div className="col-span-2">
                    <span className="text-[10px] text-blue-600 font-black uppercase block">Revised Quote Details</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Revised Quote</span>
                    <span className="font-medium text-slate-800">{req.revisedQuoteId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Version</span>
                    <span className="font-medium text-slate-800">v{req.revisedQuoteSnapshot.version || 2}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Price</span>
                    <span className="font-black text-blue-700">{req.revisedQuoteSnapshot.currency || 'USD'} {req.revisedQuoteSnapshot.tariffAmount?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              )}

              {/* Status Specific UI */}
              {req.status === 'PENDING' && (
                <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg text-xs text-slate-600 font-medium">
                  <Clock className="w-4 h-4" /> Waiting for Freight Agent review...
                </div>
              )}
              {req.status === 'IN_PROGRESS' && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium">
                  <FileQuestion className="w-4 h-4" /> Freight Agent is currently reviewing...
                </div>
              )}
              {req.status === 'INFO_REQUESTED' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <MessageSquare className="w-4 h-4" /> Missing Information Requested:
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-amber-700">
                    {req.missingInfoRequested.map((info, idx) => (
                      <li key={idx}>{info}</li>
                    ))}
                  </ul>
                  <button className="mt-2 text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-lg w-full">
                    Upload Required Documents (Coming Soon)
                  </button>
                </div>
              )}
              {req.status === 'REVISION_ISSUED' && req.revisedQuoteId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" /> Agent modified the quote!
                  </div>
                  <p className="text-[11px] text-blue-700">Please review the new quote ({req.revisedQuoteId}) and accept or reject.</p>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleAction(req.revisedQuoteId!, 'ACCEPT')} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-1.5 rounded-lg">Accept Revision</button>
                    <button onClick={() => handleAction(req.revisedQuoteId!, 'REJECT')} className="flex-1 bg-white hover:bg-slate-50 text-red-600 border border-slate-200 font-bold text-xs py-1.5 rounded-lg">Reject</button>
                  </div>
                </div>
              )}
              {req.status === 'APPROVED' && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Verification Approved. Ready to Book.
                </div>
              )}
              {req.status === 'REJECTED' && (
                <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold">
                  <XCircle className="w-4 h-4" /> Verification Rejected by Agent.
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
