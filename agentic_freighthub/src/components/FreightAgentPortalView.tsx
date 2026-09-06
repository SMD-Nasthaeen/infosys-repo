import React, { useState } from 'react';
import {
  Ship,
  Compass,
  Globe,
  Radio,
  FileCheck2,
  Anchor,
  Navigation,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Search,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { FreightAgentSidebarNav, FreightAgentTab } from './FreightAgentSidebarNav';
import { Milestone1RouteOperationsView } from './Milestone1RouteOperationsView';
import { TrackingView } from './TrackingView';
import { BrokerQuoteReviewModal } from './BrokerQuoteReviewModal';
import { PORTS_AND_HUBS } from '../data/freightData';
import { formatCurrency } from '../utils/calculator';
import { CarrierSpotRate, UserRole, SavedQuotation } from '../types';

interface FreightAgentPortalViewProps {
  userName?: string;
  userEmail?: string;
  agentSubTab?: FreightAgentTab;
  onSelectAgentTab?: (tab: FreightAgentTab) => void;
  userRole?: UserRole;
  quotations?: SavedQuotation[];
  onUpdateQuotation?: (quote: SavedQuotation) => void;
}

const SPOT_LINE_RATES: CarrierSpotRate[] = [
  {
    id: 'spot-101',
    carrierName: 'Maersk Line',
    originPort: 'INNSA',
    destinationPort: 'AEJEA',
    mode: 'ocean',
    equipment: '20GP Container',
    buyRateInr: 118000,
    suggestedSellInr: 135000,
    transitDays: 5,
    validUntil: '2026-08-31',
    spaceAvailability: 'High',
    reliabilityScore: '96%',
    directOrTranshipment: 'Direct Express Line',
  },
  {
    id: 'spot-102',
    carrierName: 'MSC Mediterranean',
    originPort: 'INNSA',
    destinationPort: 'AEJEA',
    mode: 'ocean',
    equipment: '40HC Container',
    buyRateInr: 185000,
    suggestedSellInr: 215000,
    transitDays: 6,
    validUntil: '2026-08-30',
    spaceAvailability: 'High',
    reliabilityScore: '94%',
    directOrTranshipment: 'Direct Service',
  },
  {
    id: 'spot-103',
    carrierName: 'CMA CGM',
    originPort: 'INMAA',
    destinationPort: 'SGSIN',
    mode: 'ocean',
    equipment: '20GP Container',
    buyRateInr: 98000,
    suggestedSellInr: 114000,
    transitDays: 7,
    validUntil: '2026-09-05',
    spaceAvailability: 'Medium',
    reliabilityScore: '92%',
    directOrTranshipment: 'Via Port Klang (MYPKG)',
  },
  {
    id: 'spot-104',
    carrierName: 'Hapag-Lloyd',
    originPort: 'INNSA',
    destinationPort: 'NLRTM',
    mode: 'ocean',
    equipment: '40HC Container',
    buyRateInr: 295000,
    suggestedSellInr: 340000,
    transitDays: 22,
    validUntil: '2026-08-28',
    spaceAvailability: 'Medium',
    reliabilityScore: '95%',
    directOrTranshipment: 'Via Jebel Ali (AEJEA)',
  },
  {
    id: 'spot-105',
    carrierName: 'Emirates SkyCargo',
    originPort: 'BOM',
    destinationPort: 'DXB',
    mode: 'air',
    equipment: 'ULD Air Pallet (1500kg)',
    buyRateInr: 285000,
    suggestedSellInr: 335000,
    transitDays: 1,
    validUntil: '2026-08-25',
    spaceAvailability: 'High',
    reliabilityScore: '99%',
    directOrTranshipment: 'Direct Daily Flight',
  },
  {
    id: 'spot-106',
    carrierName: 'Qatar Airways Cargo',
    originPort: 'DEL',
    destinationPort: 'LHR',
    mode: 'air',
    equipment: 'Air Cargo Loose (1200kg)',
    buyRateInr: 390000,
    suggestedSellInr: 450000,
    transitDays: 2,
    validUntil: '2026-08-27',
    spaceAvailability: 'Tight',
    reliabilityScore: '97%',
    directOrTranshipment: 'Via Hamad Intl (DOH)',
  },
];

export const FreightAgentPortalView: React.FC<FreightAgentPortalViewProps> = ({
  userName = 'Freight Operations Agent',
  userEmail = 'agent@freighthub.com',
  agentSubTab = 'operations-overview',
  onSelectAgentTab,
  userRole = 'freight-agent',
  quotations = [],
  onUpdateQuotation,
}) => {
  const [internalTab, setInternalTab] = useState<FreightAgentTab>(agentSubTab);
  const activeTab = agentSubTab || internalTab;

  const handleTabChange = (tab: FreightAgentTab) => {
    setInternalTab(tab);
    if (onSelectAgentTab) onSelectAgentTab(tab);
  };

  const [bookingToast, setBookingToast] = useState<string | null>(null);

  // Quote Review Queue: customer-submitted quotes awaiting agent approval & dispatch
  const pendingReviewQuotes = quotations.filter((q) => q && q.status === 'PENDING_REVIEW');
  const finalizedQuotes = quotations.filter((q) => q && (q.status === 'BROKER_FINALIZED' || q.status === 'ISSUED' || q.status === 'APPROVED' || q.status === 'SENT'));
  const [reviewingQuote, setReviewingQuote] = useState<SavedQuotation | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [dispatchToast, setDispatchToast] = useState<string | null>(null);

  const handleOpenReview = (quote: SavedQuotation) => {
    setReviewingQuote(quote);
    setIsReviewModalOpen(true);
  };

  const handleDispatchFinalizedQuote = (updatedQuote: SavedQuotation) => {
    if (onUpdateQuotation) {
      onUpdateQuotation(updatedQuote);
    }
    setIsReviewModalOpen(false);
    setReviewingQuote(null);
    setDispatchToast(`Quote ${updatedQuote.id} approved & dispatched to customer ${updatedQuote.shipperName || ''} — now ready for acceptance.`.replace('  ', ' '));
    setTimeout(() => setDispatchToast(null), 5000);
  };

  const handleBookSlot = (rate: CarrierSpotRate) => {
    setBookingToast(`Container slot confirmed with ${rate.carrierName} on ${rate.originPort} -> ${rate.destinationPort}`);
    setTimeout(() => setBookingToast(null), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast */}
      {bookingToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-teal-500 flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-teal-400" />
          <span>{bookingToast}</span>
        </div>
      )}

      {/* Dispatch confirmation toast */}
      {dispatchToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500 flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{dispatchToast}</span>
        </div>
      )}

      {/* Broker/Brokerage Quote Review & Dispatch Modal (opened from Quote Review queue) */}
      <BrokerQuoteReviewModal
        quote={reviewingQuote}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewingQuote(null);
        }}
        onSaveQuote={handleDispatchFinalizedQuote}
      />

      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-600/20">
              <Anchor className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-teal-600 uppercase tracking-widest">
                  Freight Agent Operations
                </span>
                <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                  Carrier Bidding & Fleet Tracking
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Vessel Dispatch & Route Optimizer
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Logged in as <span className="font-bold text-slate-800">{userName}</span> ({userEmail}) • Active Field Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange('cargo-tracking')}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Globe className="w-4 h-4" />
              <span>Live Fleet Tracking</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Freight Agent Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 lg:sticky lg:top-20 z-10">
          <FreightAgentSidebarNav
            activeTab={activeTab}
            onSelectTab={handleTabChange}
            pendingQuoteCount={pendingReviewQuotes.length}
          />
        </div>

        {/* Center / Right Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: OPERATIONS OVERVIEW */}
          {activeTab === 'operations-overview' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Operations KPI metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Active Containers</span>
                    <Ship className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">38 FCL Units</div>
                  <div className="text-[11px] text-teal-600 font-bold">14 Vessels in Transit</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Direct Tier-1 Lines</span>
                    <Anchor className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-blue-600 tracking-tight">6 Carriers</div>
                  <div className="text-[11px] text-slate-500">Maersk, MSC, CMA, Hapag</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>On-Time Dispatch</span>
                    <Navigation className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 tracking-tight">98.4%</div>
                  <div className="text-[11px] text-emerald-700 font-bold">Corridor SLA met</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Customs Gate Passes</span>
                    <FileCheck2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-purple-600 tracking-tight">22 Cleared</div>
                  <div className="text-[11px] text-purple-700 font-medium">0 port demurrage hold</div>
                </div>
              </div>

              {/* Live Vessel Radar Card */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-teal-400 font-black text-xs uppercase tracking-wider">
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>Live Dispatch Radar</span>
                    </div>
                    <h3 className="text-xl font-black text-white mt-1">High-Priority Corridor Operations</h3>
                  </div>

                  <button
                    onClick={() => handleTabChange('cargo-tracking')}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider self-start"
                  >
                    <span>Inspect Global Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">MV MSC OSCAR</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                        ON TIME
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">INNSA (Nhava Sheva) → AEJEA (Jebel Ali)</div>
                    <div className="text-[11px] text-teal-300 font-mono">ETA: 2026-08-20 • 20 TEU Loaded</div>
                  </div>

                  <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">MAERSK MC-KINNEY</span>
                      <span className="text-[10px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded border border-blue-800 font-bold">
                        IN TRANSIT
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">INNSA (Nhava Sheva) → NLRTM (Rotterdam)</div>
                    <div className="text-[11px] text-teal-300 font-mono">ETA: 2026-09-02 • 14 TEU Loaded</div>
                  </div>

                  <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">CMA CGM MARCO POLO</span>
                      <span className="text-[10px] bg-purple-950 text-purple-400 px-2 py-0.5 rounded border border-purple-800 font-bold">
                        BERTHING
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">INMAA (Chennai) → SGSIN (Singapore)</div>
                    <div className="text-[11px] text-teal-300 font-mono">ETA: Today 18:30 • 8 TEU Loaded</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CARGO TRACKING */}
          {activeTab === 'cargo-tracking' && (
            <TrackingView userRole={userRole} />
          )}

          {/* TAB 3: ROUTE OPTIMIZER */}
          {activeTab === 'route-optimizer' && (
            <Milestone1RouteOperationsView />
          )}

          {/* TAB 4: CARRIER SPOT BIDDING */}
          {activeTab === 'carrier-spot-bidding' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Tier-1 Carrier Spot Bidding & Slot Booking
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct shipping line space allocations with verified transit days and reliability ratings.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SPOT_LINE_RATES.map((rate) => (
                  <div
                    key={rate.id}
                    className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{rate.carrierName}</span>
                          <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded uppercase">
                            {rate.mode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">{rate.equipment}</div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                        {rate.reliabilityScore} On-Time
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-2 px-3 bg-white rounded-xl border border-slate-200 font-mono">
                      <div>
                        <div className="text-[10px] text-slate-400 font-sans">ORIGIN</div>
                        <div className="font-bold text-slate-900">{rate.originPort}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-teal-500" />
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-sans">DESTINATION</div>
                        <div className="font-bold text-slate-900">{rate.destinationPort}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Contract Buy Rate</div>
                        <div className="text-base font-black text-teal-800 font-mono">
                          {formatCurrency(rate.buyRateInr, 'INR')}
                        </div>
                      </div>

                      <button
                        onClick={() => handleBookSlot(rate)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow transition-all cursor-pointer"
                      >
                        Book Slot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2b: QUOTE REVIEW & DISPATCH (Customer quote requests -> agent approval -> dispatch to customer) */}
          {activeTab === 'quote-review' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Pending Review Queue */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Quote Review Queue — Pending Approval
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customer-submitted quote requests awaiting manual rate verification, margin adjustment, and dispatch to the customer portal.
                  </p>
                </div>

                {pendingReviewQuotes.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">No pending quote requests. All customer quotations have been reviewed.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingReviewQuotes.map((quote) => (
                      <div key={quote.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs text-slate-900">{quote.id}</span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200 uppercase">
                              Pending Agent Review
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 truncate">
                            {quote.companyName || quote.shipperName || 'Customer'} • {quote.originCode || quote.formData?.originPortCode || '—'} → {quote.destinationCode || quote.formData?.destinationPortCode || '—'} • {quote.cargoSummary || 'Cargo'} • Submitted {quote.createdAt}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">AI Calculated</div>
                            <div className="text-sm font-black text-slate-900 font-mono">{formatCurrency(quote.tariffAmount, quote.currency || 'INR')}</div>
                          </div>
                          <button
                            onClick={() => handleOpenReview(quote)}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow transition-all cursor-pointer whitespace-nowrap"
                          >
                            Review & Adjust
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMS & CFS GATEPASS */}
          {activeTab === 'customs-dispatch' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Customs Clearance & CFS Gatepass Records
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated electronic gate pass (e-EIR) verification, Icegate EDI bill of entry filing, and port terminal releases.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-slate-900">E-GATEPASS #CFS-99120</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        CLEARED & GATED OUT
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      JNPT Port (Nhava Sheva) • Container MSCU9821442 (40HC) • Shipped to AEJEA
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-500">Icegate EDI Verified</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-slate-900">E-GATEPASS #CFS-99121</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                        INSPECTION COMPLETED
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Chennai Port (INMAA) • Container CMAU1094821 (20GP) • Shipped to SGSIN
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-500">Seal Intact • Passed X-Ray</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
