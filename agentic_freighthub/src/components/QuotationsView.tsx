import React, { useState } from 'react';
import { FileText, Download, Eye, ArrowLeft, ShieldCheck, Search, Filter, Ship, Plane, Truck, CheckCircle2, Check } from 'lucide-react';
import { SavedQuotation } from '../types';
import { formatCurrency } from '../utils/calculator';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { CustomerQuoteView } from './CustomerQuoteView';

interface QuotationsViewProps {
  quotations: SavedQuotation[];
  onViewQuotePDF: (quote: SavedQuotation) => void;
  onCreateNewQuote: () => void;
  onUpdateQuotation?: (quote: SavedQuotation) => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  quotations,
  onViewQuotePDF,
  onCreateNewQuote,
  onUpdateQuotation,
}) => {
  const [selectedCustomerQuote, setSelectedCustomerQuote] = useState<SavedQuotation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState<'all' | 'ocean' | 'air' | 'ground'>('all');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const filteredQuotes = (quotations || []).filter((quote) => {
    if (!quote) return false;
    const term = (searchTerm || '').toLowerCase().trim();
    const matchesSearch =
      !term ||
      (quote.id || '').toLowerCase().includes(term) ||
      (quote.companyName && quote.companyName.toLowerCase().includes(term)) ||
      (quote.shipperName && quote.shipperName.toLowerCase().includes(term)) ||
      (quote.routeSummary && quote.routeSummary.toLowerCase().includes(term)) ||
      (quote.originCode && quote.originCode.toLowerCase().includes(term)) ||
      (quote.destinationCode && quote.destinationCode.toLowerCase().includes(term));

    const matchesMode = selectedMode === 'all' || quote.transportMode === selectedMode;
    return matchesSearch && matchesMode;
  });

  const handleDirectAccept = (quote: SavedQuotation) => {
    const updated: SavedQuotation = {
      ...quote,
      status: 'ACCEPTED',
    };
    if (onUpdateQuotation) {
      onUpdateQuotation(updated);
    }
    setFeedbackBanner(`Quotation ${quote.id} accepted successfully! Carrier booking confirmed.`);
    setTimeout(() => setFeedbackBanner(null), 5000);
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'ocean':
        return <Ship className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'air':
        return <Plane className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      default:
        return <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
  };

  const getModeLabel = (quote: SavedQuotation) => {
    const modeUpper = (quote.transportMode || 'OCEAN').toUpperCase();
    if (quote.transportMode === 'ocean' && quote.oceanLoadType) {
      return `${modeUpper} · ${quote.oceanLoadType}`;
    }
    return modeUpper;
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/90 space-y-6">
      {/* Feedback Banner */}
      {feedbackBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-900 text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackBanner}</span>
          </div>
          <button onClick={() => setFeedbackBanner(null)} className="text-emerald-700 hover:text-emerald-900 font-black">
            ✕
          </button>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-md shadow-amber-500/20 shrink-0">
            <FileText className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Commercial Quotation History & Issued PDFs
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Export, preview, and review all active commercial freight quote records ({quotations.length} total)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onCreateNewQuote}
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Generate New Quote</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Quote ID, Shipper, Route, or Port..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 pl-1 pr-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Mode:</span>
          </span>
          {(['all', 'ocean', 'air', 'ground'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer capitalize ${
                selectedMode === mode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              {mode === 'all' ? 'All Modes' : mode}
            </button>
          ))}
        </div>
      </div>

      {/* CUSTOMER PROJECTION MODAL */}
      {selectedCustomerQuote && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl my-8">
            <CustomerQuoteView
              quoteId={selectedCustomerQuote.id}
              savedQuotation={selectedCustomerQuote}
              onClose={() => setSelectedCustomerQuote(null)}
              onUpdateQuotation={(updated) => {
                if (onUpdateQuotation) onUpdateQuotation(updated);
                setSelectedCustomerQuote(updated);
              }}
            />
          </div>
        </div>
      )}

      {/* Table Container - Perfectly fitting the box */}
      <div className="w-full bg-slate-900 text-white rounded-2xl overflow-hidden shadow-lg border border-slate-800">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-950/90">
                <th className="py-3.5 px-4 whitespace-nowrap">QUOTE ID</th>
                <th className="py-3.5 px-4 whitespace-nowrap">USER</th>
                <th className="py-3.5 px-4">ROUTE</th>
                <th className="py-3.5 px-4 whitespace-nowrap">TRANSPORT MODE</th>
                <th className="py-3.5 px-4 whitespace-nowrap">SELL TARIFF (INR)</th>
                <th className="py-3.5 px-4 whitespace-nowrap">STATUS</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                    No matching quotation records found. Try adjusting your search or filter.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-800/60 transition-colors">
                    {/* Quote ID */}
                    <td className="py-3.5 px-4 font-black text-blue-400 whitespace-nowrap">
                      {quote.id}
                    </td>

                    {/* User */}
                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      {quote.companyName || quote.shipperName || 'Commercial User'}
                    </td>

                    {/* Route */}
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      <div className="whitespace-nowrap">{quote.routeSummary}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Incoterm: {quote.formData?.incoterm || 'FOB'}
                      </div>
                    </td>

                    {/* Mode - Word-wrap immune, unified badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 text-slate-200 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shadow-sm">
                        {getModeIcon(quote.transportMode)}
                        <span className="tracking-wide">{getModeLabel(quote)}</span>
                      </span>
                    </td>

                    {/* Tariff Amount */}
                    <td className="py-3.5 px-4 font-black text-emerald-400 whitespace-nowrap text-sm">
                      {formatCurrency(quote.tariffAmount, quote.currency)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {quote.status === 'ACCEPTED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          <span>Accepted & Booked</span>
                        </span>
                      ) : quote.status === 'PENDING_BROKER_REVIEW' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>Under Broker Review</span>
                        </span>
                      ) : quote.status === 'BROKER_FINALIZED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <span>Ready for Acceptance</span>
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                            quote.status === 'ISSUED'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : quote.status === 'DECLINED'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-blue-400/10 text-blue-300 border border-blue-400/20'
                          }`}
                        >
                          {quote.status || 'ISSUED'}
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                      {quote.status !== 'ACCEPTED' && quote.status !== 'DECLINED' && (
                        <button
                          onClick={() => handleDirectAccept(quote)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                          title="Instant Accept & Book"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept & Book</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedCustomerQuote(quote)}
                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-2.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors border border-blue-500/30 cursor-pointer"
                        title="View Customer Projection & Terms"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>Projection</span>
                      </button>
                      <button
                        onClick={() => onViewQuotePDF(quote)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer"
                        title="View PDF Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => generateQuotePDF(quote)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                        title="Download PDF Invoice"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


