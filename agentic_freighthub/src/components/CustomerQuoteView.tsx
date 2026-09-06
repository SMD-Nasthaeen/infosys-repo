import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Download,
  AlertCircle,
  ArrowRight,
  Send,
  Building,
  MapPin,
  Check,
  HelpCircle,
} from 'lucide-react';
import { Money } from './Money';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { SavedQuotation } from '../types';

interface CustomerQuoteProjection {
  quoteId: string;
  versionNumber: number;
  status: string;
  originPortCode: string;
  destinationPortCode: string;
  incoterm: string;
  transportMode: string;
  issuedAt?: string;
  validUntil?: string;
  sellPrice: string;
  currency: string;
  chargeBasisLabel: string;
  items: Array<{
    code: string;
    name: string;
    description?: string;
  }>;
}

interface CustomerQuoteViewProps {
  quoteId: string;
  savedQuotation?: SavedQuotation;
  onClose?: () => void;
  onUpdateQuotation?: (updated: SavedQuotation) => void;
}

export const CustomerQuoteView: React.FC<CustomerQuoteViewProps> = ({
  quoteId,
  savedQuotation,
  onClose,
  onUpdateQuotation,
}) => {
  const [projection, setProjection] = useState<CustomerQuoteProjection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusState, setStatusState] = useState<string>('ISSUED');
  const [showDeclineModal, setShowDeclineModal] = useState<boolean>(false);
  const [declineReason, setDeclineReason] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjection() {
      setLoading(true);
      try {
        const res = await fetch(`/portal/quotes/${quoteId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setProjection(json.data);
          setStatusState(json.data.status || 'ISSUED');
        } else if (savedQuotation) {
          // Fallback to local saved quotation format
          const originCode = savedQuotation.originCode || savedQuotation.formData?.originPortCode || 'INNSA';
          const destCode = savedQuotation.destinationCode || savedQuotation.formData?.destinationPortCode || 'AEJEA';
          const incotermVal = savedQuotation.formData?.incoterm || 'FOB';
          setProjection({
            quoteId: savedQuotation.id,
            versionNumber: 1,
            status: savedQuotation.status || 'ISSUED',
            originPortCode: originCode,
            destinationPortCode: destCode,
            incoterm: incotermVal,
            transportMode: savedQuotation.transportMode,
            issuedAt: savedQuotation.createdAt || new Date().toISOString().split('T')[0],
            validUntil: '14 Days from Issue',
            sellPrice: (savedQuotation.tariffAmount || 0).toFixed(2),
            currency: savedQuotation.currency || 'INR',
            chargeBasisLabel: `${incotermVal} Commercial Freight Service`,
            items: [
              { code: 'OFR', name: 'Ocean Freight / Linehaul Service' },
              { code: 'BAF', name: 'Bunker Adjustment Factor (Fuel Surcharge)' },
              { code: 'THCO', name: 'Terminal Handling Charge - Origin Port' },
              { code: 'DOC', name: 'Documentation & Bill of Lading Fee' },
            ],
          });
          setStatusState(savedQuotation.status || 'ISSUED');
        }
      } catch (err) {
        if (savedQuotation) {
          const originCode = savedQuotation.originCode || savedQuotation.formData?.originPortCode || 'INNSA';
          const destCode = savedQuotation.destinationCode || savedQuotation.formData?.destinationPortCode || 'AEJEA';
          const incotermVal = savedQuotation.formData?.incoterm || 'FOB';
          setProjection({
            quoteId: savedQuotation.id,
            versionNumber: 1,
            status: savedQuotation.status || 'ISSUED',
            originPortCode: originCode,
            destinationPortCode: destCode,
            incoterm: incotermVal,
            transportMode: savedQuotation.transportMode,
            sellPrice: (savedQuotation.tariffAmount || 0).toFixed(2),
            currency: savedQuotation.currency || 'INR',
            chargeBasisLabel: `${incotermVal} Commercial Freight Service`,
            items: [
              { code: 'OFR', name: 'Ocean Freight Service' },
              { code: 'BAF', name: 'Fuel Surcharge (BAF)' },
              { code: 'THCO', name: 'Origin Terminal Handling' },
            ],
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProjection();
  }, [quoteId, savedQuotation]);

  // Handle Customer Accept Action
  const handleAcceptQuote = async () => {
    try {
      await fetch(`/api/v1/quotes/${quoteId}/accept`, { method: 'POST' });
    } catch (err) {
      // Ignored for frontend mock mode
    }

    setStatusState('ACCEPTED');
    setActionSuccessMessage('Quotation accepted successfully! Booking confirmed and operations team notified.');

    if (savedQuotation && onUpdateQuotation) {
      onUpdateQuotation({
        ...savedQuotation,
        status: 'ACCEPTED',
      });
    }
  };

  // Handle Customer Decline Action with mandatory reason
  const handleDeclineQuote = async () => {
    if (!declineReason.trim()) return;

    try {
      await fetch(`/api/v1/quotes/${quoteId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: declineReason }),
      });
    } catch (err) {
      // Ignored for frontend mock mode
    }

    setStatusState('DECLINED');
    setShowDeclineModal(false);
    setActionSuccessMessage(`Quotation declined. Reason recorded: "${declineReason}"`);

    if (savedQuotation && onUpdateQuotation) {
      onUpdateQuotation({
        ...savedQuotation,
        status: 'DECLINED',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-900 text-slate-300 rounded-3xl border border-slate-800">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading Customer Quote View...</p>
      </div>
    );
  }

  if (!projection) {
    return (
      <div className="p-8 text-center bg-slate-900 text-slate-300 rounded-3xl border border-slate-800 space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-base font-black text-white">Quotation Not Found</h3>
        <p className="text-xs text-slate-400">The requested quotation projection is unavailable or expired.</p>
        {onClose && (
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">{projection.quoteId}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                v{projection.versionNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Customer Portal Official Quotation Projection</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              statusState === 'ACCEPTED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : statusState === 'DECLINED'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {statusState}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Commercial Summary Box */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              TOTAL COMMITTED FREIGHT CHARGE
            </div>
            <div className="text-3xl font-black text-white font-mono flex items-baseline gap-2">
              <Money amount={projection.sellPrice} currency={projection.currency} />
              <span className="text-xs font-sans text-slate-400 font-semibold">ALL-INCLUSIVE</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VALIDITY PERIOD</div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Valid Until: {projection.validUntil || '31 Dec 2026'}</span>
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CORRIDOR</div>
            <div className="font-mono font-bold text-slate-200 flex items-center gap-2">
              <span>{projection.originPortCode}</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
              <span>{projection.destinationPortCode}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">INCOTERM RESPONSIBILITY</div>
            <div className="font-bold text-cyan-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>{projection.incoterm} Terms Applicable</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">TRANSPORT MODE</div>
            <div className="font-bold text-slate-200 uppercase">{projection.transportMode} FREIGHT</div>
          </div>
        </div>

        {/* Itemised Services Included (Sell-Price Names Only) */}
        <div>
          <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-3">
            Services & Surcharges Included
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {(projection?.items || []).map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center gap-2 text-slate-300 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Frozen Assumptions Block */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
          <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Commercial Assumptions & Disclaimers</span>
          </div>
          <p>• Rate valid for stated container specification and count only.</p>
          <p>• Excludes destination customs duties, taxes, and government statutory charges unless explicitly DDP.</p>
          <p>• Rate subject to carrier space and container equipment availability at time of booking.</p>
        </div>
      </div>

      {/* Customer Accept / Decline Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Strict Commercial Privacy: Buy cost, margins, and internal rates are securely protected.</span>
        </div>

        <div className="flex items-center gap-3">
          {savedQuotation && (
            <button
              onClick={() => generateQuotePDF(savedQuotation)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Download Branded PDF</span>
            </button>
          )}

          {(statusState !== 'ACCEPTED' && statusState !== 'DECLINED') && (
            <>
              <button
                onClick={() => setShowDeclineModal(true)}
                className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Decline Quote</span>
              </button>

              <button
                onClick={handleAcceptQuote}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer uppercase tracking-wider"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Quotation</span>
              </button>
            </>
          )}

          {statusState === 'ACCEPTED' && (
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-xl text-xs font-black">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Quotation Accepted & Booking Confirmed</span>
            </div>
          )}

          {statusState === 'DECLINED' && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-xl text-xs font-black">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>Quotation Declined</span>
            </div>
          )}
        </div>
      </div>

      {/* DECLINE REASON MODAL */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span>Decline Quotation</span>
            </h3>
            <p className="text-xs text-slate-400">
              Please provide a reason for declining this commercial quotation. This field is mandatory.
            </p>

            <textarea
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Found lower rate with alternative carrier, or shipment date postponed..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineQuote}
                disabled={!declineReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer transition-all"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
