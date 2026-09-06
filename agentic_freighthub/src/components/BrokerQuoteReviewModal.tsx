import React, { useState } from 'react';
import {
  X,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Ship,
  Plane,
  Truck,
  Send,
  AlertCircle,
  Clock,
  MapPin,
  TrendingUp,
  FileText,
  Sliders
} from 'lucide-react';
import { SavedQuotation } from '../types';
import { formatCurrency } from '../utils/calculator';

interface BrokerQuoteReviewModalProps {
  quote: SavedQuotation | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveQuote?: (updatedQuote: SavedQuotation) => void;
  onSaveAndDispatch?: (updatedQuote: SavedQuotation) => void;
  onSave?: (updatedQuote: SavedQuotation) => void;
}

export const BrokerQuoteReviewModal: React.FC<BrokerQuoteReviewModalProps> = ({
  quote,
  isOpen,
  onClose,
  onSaveQuote,
  onSaveAndDispatch,
  onSave,
}) => {
  if (!isOpen || !quote) return null;

  // Initialize editable fields with existing values
  const [baseTariff, setBaseTariff] = useState<number>(quote.breakdown.baseTariff || quote.tariffAmount * 0.7);
  const [bafFuelSurcharge, setBafFuelSurcharge] = useState<number>(quote.breakdown.bafFuelSurcharge || Math.round(quote.tariffAmount * 0.12));
  const [terminalHandling, setTerminalHandling] = useState<number>(quote.breakdown.terminalHandlingCharge || Math.round(quote.tariffAmount * 0.08));
  const [documentationFee, setDocumentationFee] = useState<number>(quote.breakdown.documentationFee || 3500);
  const [brokerMarginPct, setBrokerMarginPct] = useState<number>(quote.brokerMarginPct ?? 10);
  const [assignedCarrier, setAssignedCarrier] = useState<string>(quote.assignedCarrier || 'Maersk Line Direct Service');
  const [estimatedTransitDays, setEstimatedTransitDays] = useState<string>(quote.breakdown.estimatedTransitDays || '4-6 Days');
  const [brokerNotes, setBrokerNotes] = useState<string>(
    quote.brokerReviewNotes ||
    'Rate verified by FreightHub brokerage desk. Includes container allocation, terminal handling, and customs export clearance.'
  );

  // Real-time recalculation
  const carrierSubtotal = baseTariff + bafFuelSurcharge + terminalHandling + documentationFee;
  const brokerProfitInr = Math.round(carrierSubtotal * (brokerMarginPct / 100));
  const subtotalBeforeTax = carrierSubtotal + brokerProfitInr;
  const estimatedGst = Math.round(subtotalBeforeTax * 0.05); // 5% GST
  const grandTotal = subtotalBeforeTax + estimatedGst;

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedQuote: SavedQuotation = {
      ...quote,
      tariffAmount: grandTotal,
      status: 'BROKER_FINALIZED',
      assignedCarrier,
      brokerMarginPct,
      brokerProfitInr,
      brokerReviewNotes: brokerNotes,
      brokerAdjustedAt: new Date().toISOString(),
      isBrokerEdited: true,
      brokerReviewed: true,
      breakdown: {
        ...quote.breakdown,
        baseTariff,
        bafFuelSurcharge,
        terminalHandlingCharge: terminalHandling,
        documentationFee,
        specialHandlingSurcharge: brokerProfitInr,
        subtotal: subtotalBeforeTax,
        estimatedTax: estimatedGst,
        grandTotal,
        estimatedTransitDays,
        chargeBasis: `Brokerage Approved & Dispatched (Spread: ${brokerMarginPct}%) - Carrier: ${assignedCarrier}`,
      },
    };

    if (onSaveQuote) {
      onSaveQuote(updatedQuote);
    } else if (onSaveAndDispatch) {
      onSaveAndDispatch(updatedQuote);
    } else if (onSave) {
      onSave(updatedQuote);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 px-5 sm:px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-md shadow-amber-500/20">
              <Briefcase className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  BROKER TARIFF EDITOR & CLIENT DISPATCH
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {quote.id}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Review & Manual Rate Adjustment
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleDispatch} className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Customer Summary Card */}
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 sm:p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Shipper Customer</div>
              <div className="text-sm font-black text-white">{quote.shipperName} ({quote.companyName})</div>
              <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>{quote.routeSummary}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Original Client Estimate</div>
              <div className="text-base font-black text-slate-300">
                {formatCurrency(quote.tariffAmount, quote.currency)}
              </div>
              <div className="text-[10px] text-amber-400 font-bold uppercase">
                Mode: {quote.transportMode.toUpperCase()} ({quote.oceanLoadType || 'Standard'})
              </div>
            </div>
          </div>

          {/* Form Controls Grid */}
          <div className="space-y-3.5">
            <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              <span>1. Itemized Cost & Linehaul Adjustments</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  CARRIER BASE FREIGHT (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={baseTariff}
                  onChange={(e) => setBaseTariff(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  BAF FUEL SURCHARGE (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={bafFuelSurcharge}
                  onChange={(e) => setBafFuelSurcharge(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  TERMINAL HANDLING (THC) (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={terminalHandling}
                  onChange={(e) => setTerminalHandling(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  DOCUMENTATION & CFS CHARGES (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={documentationFee}
                  onChange={(e) => setDocumentationFee(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Broker Margin & Carrier Selection */}
          <div className="space-y-3.5 pt-2 border-t border-slate-800">
            <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>2. Broker Margin & Carrier Routing</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  BROKER SPREAD MARGIN (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="2"
                    max="35"
                    value={brokerMarginPct}
                    onChange={(e) => setBrokerMarginPct(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <span className="font-black text-amber-400 text-xs w-10 text-right">
                    {brokerMarginPct}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  ASSIGNED CARRIER VESSEL/FLIGHT
                </label>
                <select
                  value={assignedCarrier}
                  onChange={(e) => setAssignedCarrier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="Maersk Line Direct Service">Maersk Line (Direct)</option>
                  <option value="MSC Mediterranean Line">MSC Mediterranean</option>
                  <option value="CMA CGM Express Service">CMA CGM Express</option>
                  <option value="Hapag-Lloyd Ocean Express">Hapag-Lloyd Ocean</option>
                  <option value="Emirates SkyCargo Flight">Emirates SkyCargo</option>
                  <option value="Qatar Airways Cargo">Qatar Airways Cargo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  TRANSIT TIME ESTIMATE
                </label>
                <input
                  type="text"
                  value={estimatedTransitDays}
                  onChange={(e) => setEstimatedTransitDays(e.target.value)}
                  placeholder="e.g. 4-6 Days"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Broker Instructions & Notes for Customer */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-[11px] font-bold text-slate-300 uppercase">
              BROKER NOTES & COMMERCIAL TERMS (VISIBLE ON CLIENT QUOTE & PDF)
            </label>
            <textarea
              rows={2}
              value={brokerNotes}
              onChange={(e) => setBrokerNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Projected Live Calculations Box */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Carrier Buy Cost</div>
                <div className="text-xs font-black text-slate-200 mt-0.5">{formatCurrency(carrierSubtotal, 'INR')}</div>
              </div>

              <div className="bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30">
                <div className="text-[10px] text-amber-400 font-bold uppercase">Broker Spread Profit</div>
                <div className="text-xs font-black text-amber-300 mt-0.5">+{formatCurrency(brokerProfitInr, 'INR')}</div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Applicable GST (5%)</div>
                <div className="text-xs font-black text-slate-200 mt-0.5">{formatCurrency(estimatedGst, 'INR')}</div>
              </div>

              <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/30">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">New Client Total</div>
                <div className="text-sm font-black text-emerald-400 mt-0.5">{formatCurrency(grandTotal, 'INR')}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 sm:pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-amber-500/30 cursor-pointer"
            >
              <Send className="w-4 h-4 fill-current" />
              <span>Finalize & Dispatch to Customer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
