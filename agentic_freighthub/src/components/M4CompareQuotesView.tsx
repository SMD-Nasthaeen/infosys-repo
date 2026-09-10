import React, { useState } from 'react';
import { SavedQuotation } from '../types';
import { Check, Shield, AlertCircle, Package, ArrowRight } from 'lucide-react';

interface M4CompareQuotesViewProps {
  quotations: SavedQuotation[];
  onQuoteSelected: () => void;
  userEmail: string;
}

export const M4CompareQuotesView: React.FC<M4CompareQuotesViewProps> = ({
  quotations,
  onQuoteSelected,
  userEmail
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter for quotes that are not REJECTED, ACCEPTED, BOOKED, or SUPERSEDED
  // We keep EXPIRED quotes to show them in the UI as disabled
  const availableQuotes = quotations.filter(
    (q) =>
      q.status !== 'REJECTED' &&
      q.status !== 'ACCEPTED' &&
      q.status !== 'BOOKED' &&
      q.status !== 'SUPERSEDED' &&
      (!q.shipperEmail || q.shipperEmail === userEmail)
  );

  const handleSelectQuote = async (quote: SavedQuotation) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      
      const response = await fetch('/api/quotes/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quoteId: quote.id })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to select quote.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`Quote ${quote.id} Selected Successfully! Verification Request Created.`);
      setTimeout(() => {
        onQuoteSelected();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5 animate-in fade-in">
      <div>
        <h3 className="text-base font-black text-slate-900">Compare Company Quotes</h3>
        <p className="text-xs text-slate-500">
          Select a verified rate proposal below to submit it for final freight agent verification.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {availableQuotes.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No Quotes Available</h4>
          <p className="text-xs text-slate-400">Generate a quote from the Rate Calculator to view comparisons here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableQuotes.map((q) => {
            const isExpired = q.status === 'EXPIRED' || (q.expiresAt && Date.now() > new Date(q.expiresAt).getTime());
            return (
            <div key={q.id} className={`bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden ${isExpired ? 'opacity-75' : ''}`}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${isExpired ? 'text-slate-400' : 'text-blue-600'}`} />
                  <span className="font-black text-xs text-slate-900">{q.companyName || 'FreightHub'}</span>
                  {q.version && q.version > 1 && (
                     <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">v{q.version}</span>
                  )}
                  {isExpired && (
                     <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Expired</span>
                  )}
                </div>
                <span className="font-black text-xs text-slate-500">{q.id}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                 <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Route</span>
                    <span className="font-medium text-slate-800">{q.originCode} → {q.destinationCode}</span>
                 </div>
                 <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Mode / Cargo</span>
                    <span className="font-medium text-slate-800 uppercase">{q.transportMode} • {q.oceanLoadType || 'N/A'}</span>
                 </div>
                 <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Validity</span>
                    <span className="font-medium text-slate-800">{q.validUntil || 'N/A'}</span>
                 </div>
                 <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Cost</span>
                    <span className="font-black text-blue-700 text-sm">{q.currency || 'USD'} {q.tariffAmount?.toLocaleString() || '0'}</span>
                 </div>
              </div>

              {q.modificationReason && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900 font-medium">
                  <span className="font-bold">Agent Modification:</span> {q.modificationReason}
                </div>
              )}

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => handleSelectQuote(q)}
                  disabled={isSubmitting || isExpired}
                  className={`${isExpired ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'} font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm`}
                >
                  <span>{isExpired ? 'Quote Expired' : 'Select Quote'}</span>
                  {!isExpired && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
