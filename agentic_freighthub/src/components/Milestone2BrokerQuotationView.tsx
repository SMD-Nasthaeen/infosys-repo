import React, { useState } from 'react';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Sliders,
  Download,
  Building,
  Anchor,
  Box,
  Truck,
  Ship,
  Sparkles,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { INITIAL_SHIPMENTS, ShipmentRecord } from '../data/shipmentData';

interface BrokerQuoteRecord {
  quoteId: string;
  shipmentId: string;
  customerName: string;
  customerId: string;
  originPort: string;
  destinationPort: string;
  transitDays: number;
  carrierName: string;
  cargoType: string;
  containerType: string;
  freightCostUsd: number;
  operationalCostUsd: number;
  marginPct: number;
  marginAmountUsd: number;
  finalQuoteUsd: number;
  status: 'GENERATED' | 'APPROVED' | 'REJECTED' | 'PENDING';
  validUntil: string;
  rejectionReason?: string;
}

const INITIAL_BROKER_QUOTES: BrokerQuoteRecord[] = [
  {
    quoteId: 'Q001',
    shipmentId: 'SHP001',
    customerName: 'ABC Logistics',
    customerId: 'C001',
    originPort: 'Chennai',
    destinationPort: 'Singapore',
    transitDays: 6,
    carrierName: 'ABC Shipping',
    cargoType: 'Electronics',
    containerType: '40FT',
    freightCostUsd: 1280,
    operationalCostUsd: 100,
    marginPct: 15,
    marginAmountUsd: 208,
    finalQuoteUsd: 1588,
    status: 'GENERATED',
    validUntil: '2026-09-15',
  },
  {
    quoteId: 'Q002',
    shipmentId: 'SHP002',
    customerName: 'XYZ Logistics',
    customerId: 'C002',
    originPort: 'Chennai',
    destinationPort: 'Dubai',
    transitDays: 9,
    carrierName: 'XYZ Shipping',
    cargoType: 'Dry Bulk',
    containerType: '20FT',
    freightCostUsd: 1750,
    operationalCostUsd: 120,
    marginPct: 14,
    marginAmountUsd: 270,
    finalQuoteUsd: 2140,
    status: 'APPROVED',
    validUntil: '2026-09-10',
  },
  {
    quoteId: 'Q003',
    shipmentId: 'SHP003',
    customerName: 'ABC Logistics',
    customerId: 'C001',
    originPort: 'Chennai',
    destinationPort: 'Colombo',
    transitDays: 3,
    carrierName: 'ABC Shipping',
    cargoType: 'General Cargo',
    containerType: '20FT',
    freightCostUsd: 620,
    operationalCostUsd: 70,
    marginPct: 14,
    marginAmountUsd: 100,
    finalQuoteUsd: 790,
    status: 'APPROVED',
    validUntil: '2026-09-20',
  },
  {
    quoteId: 'Q004',
    shipmentId: 'SHP004',
    customerName: 'Global Freight Corp',
    customerId: 'C003',
    originPort: 'Chennai',
    destinationPort: 'Rotterdam',
    transitDays: 22,
    carrierName: 'Maersk Line',
    cargoType: 'Automotive Parts',
    containerType: '40HC',
    freightCostUsd: 2150,
    operationalCostUsd: 130,
    marginPct: 14,
    marginAmountUsd: 319,
    finalQuoteUsd: 2599,
    status: 'APPROVED',
    validUntil: '2026-09-18',
  },
  {
    quoteId: 'Q005',
    shipmentId: 'SHP005',
    customerName: 'Apex Cargo Solutions',
    customerId: 'C004',
    originPort: 'Nhava Sheva',
    destinationPort: 'Dubai',
    transitDays: 5,
    carrierName: 'MSC Mediterranean',
    cargoType: 'Chemicals (Non-DG)',
    containerType: '20FT',
    freightCostUsd: 1000,
    operationalCostUsd: 100,
    marginPct: 15,
    marginAmountUsd: 165,
    finalQuoteUsd: 1265,
    status: 'APPROVED',
    validUntil: '2026-09-22',
  },
  {
    quoteId: 'Q006',
    shipmentId: 'SHP006',
    customerName: 'Zenith Global Logistics',
    customerId: 'C005',
    originPort: 'Singapore',
    destinationPort: 'Rotterdam',
    transitDays: 18,
    carrierName: 'CMA CGM',
    cargoType: 'Consumer Goods',
    containerType: '40HC',
    freightCostUsd: 2800,
    operationalCostUsd: 150,
    marginPct: 16,
    marginAmountUsd: 470,
    finalQuoteUsd: 3420,
    status: 'GENERATED',
    validUntil: '2026-09-25',
  },
];

export const Milestone2BrokerQuotationView: React.FC = () => {
  const [quotes, setQuotes] = useState<BrokerQuoteRecord[]>(INITIAL_BROKER_QUOTES);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GENERATED' | 'APPROVED' | 'REJECTED' | 'PENDING'>('ALL');
  const [selectedQuote, setSelectedQuote] = useState<BrokerQuoteRecord | null>(null);

  // Modal Interactive Margin Adjustment State
  const [activeMarginPct, setActiveMarginPct] = useState<number>(15);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [rejectionNote, setRejectionNote] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Specification Metrics (Milestone 2 Step 12)
  const totalShipments = 120;
  const quotesGenerated = 85;
  const pendingQuotes = 20;
  const approvedQuotes = 60;
  const rejectedQuotes = 5;
  const avgFreightCost = '$1,280';
  const avgQuote = '$1,520';
  const avgMargin = '15%';

  const filteredQuotes = (quotes || []).filter((q) => {
    if (!q) return false;
    if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const term = (searchTerm || '').toLowerCase();
    return (
      (q.quoteId || '').toLowerCase().includes(term) ||
      (q.shipmentId || '').toLowerCase().includes(term) ||
      (q.customerName || '').toLowerCase().includes(term) ||
      (q.originPort || '').toLowerCase().includes(term) ||
      (q.destinationPort || '').toLowerCase().includes(term) ||
      (q.carrierName || '').toLowerCase().includes(term)
    );
  });

  const handleOpenBreakdown = (quote: BrokerQuoteRecord) => {
    setSelectedQuote(quote);
    setActiveMarginPct(quote.marginPct);
    setIsRejecting(false);
    setRejectionNote('');
  };

  // Recalculated values in modal based on margin slider
  const modalCalculations = selectedQuote
    ? (() => {
        const costBase = selectedQuote.freightCostUsd + selectedQuote.operationalCostUsd;
        const marginAmt = Math.round(costBase * (activeMarginPct / 100));
        const finalPrice = costBase + marginAmt;
        return {
          costBase,
          marginAmt,
          finalPrice,
        };
      })()
    : null;

  const handleSaveMargin = () => {
    if (!selectedQuote || !modalCalculations) return;
    setQuotes((prev) =>
      prev.map((q) =>
        q.quoteId === selectedQuote.quoteId
          ? {
              ...q,
              marginPct: activeMarginPct,
              marginAmountUsd: modalCalculations.marginAmt,
              finalQuoteUsd: modalCalculations.finalPrice,
            }
          : q
      )
    );
    setSelectedQuote((prev) =>
      prev
        ? {
            ...prev,
            marginPct: activeMarginPct,
            marginAmountUsd: modalCalculations.marginAmt,
            finalQuoteUsd: modalCalculations.finalPrice,
          }
        : null
    );
    setToastMessage(`Quotation ${selectedQuote.quoteId} updated with ${activeMarginPct}% margin! New Final Quote: $${modalCalculations.finalPrice}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = (quoteId: string) => {
    setQuotes((prev) =>
      prev.map((q) => (q.quoteId === quoteId ? { ...q, status: 'APPROVED' } : q))
    );
    if (selectedQuote?.quoteId === quoteId) {
      setSelectedQuote((prev) => (prev ? { ...prev, status: 'APPROVED' } : null));
    }
    setToastMessage(`Quotation ${quoteId} marked as APPROVED! Commercial rate released to customer.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleReject = (quoteId: string) => {
    if (!rejectionNote.trim()) {
      alert('Please specify a rejection reason for auditing.');
      return;
    }
    setQuotes((prev) =>
      prev.map((q) =>
        q.quoteId === quoteId
          ? { ...q, status: 'REJECTED', rejectionReason: rejectionNote }
          : q
      )
    );
    if (selectedQuote?.quoteId === quoteId) {
      setSelectedQuote((prev) =>
        prev ? { ...prev, status: 'REJECTED', rejectionReason: rejectionNote } : null
      );
    }
    setIsRejecting(false);
    setToastMessage(`Quotation ${quoteId} REJECTED: ${rejectionNote}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black">Broker Quotation & Margin Optimization Desk</h2>
            <p className="text-xs text-slate-300 mt-1">
              Multi-factor pricing breakdown, operational surcharges, dynamic margin spread, and approval workflow
            </p>
          </div>
        </div>

        {/* Specification Metrics Grid (Step 12 exact stats) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-6 pt-6 border-t border-slate-800 text-center">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">TOTAL SHIPMENTS</span>
            <span className="text-xl font-black text-white mt-0.5 block">{totalShipments}</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider block">QUOTES GENERATED</span>
            <span className="text-xl font-black text-blue-400 mt-0.5 block">{quotesGenerated}</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">PENDING QUOTES</span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">{pendingQuotes}</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block">APPROVED QUOTES</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">{approvedQuotes}</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
            <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider block">REJECTED QUOTES</span>
            <span className="text-xl font-black text-rose-400 mt-0.5 block">{rejectedQuotes}</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider block">AVG FREIGHT COST</span>
            <span className="text-xl font-black text-cyan-300 mt-0.5 block">{avgFreightCost}</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
            <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider block">AVG QUOTE</span>
            <span className="text-xl font-black text-purple-300 mt-0.5 block">{avgQuote}</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block">AVG MARGIN</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">{avgMargin}</span>
          </div>
        </div>
      </div>

      {/* Quote List Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search quotes by ID, customer, corridor, carrier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 md:w-80"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['ALL', 'GENERATED', 'APPROVED', 'REJECTED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === filter ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs font-bold text-slate-500">
            Showing <span className="text-slate-900">{filteredQuotes.length}</span> commercial quotations
          </span>
        </div>

        {/* Step 12 Quote List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Quote ID</th>
                <th className="py-3 px-3">Shipment Ref</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Corridor</th>
                <th className="py-3 px-3">Carrier</th>
                <th className="py-3 px-3">Final Quote ($)</th>
                <th className="py-3 px-3">Margin %</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredQuotes.map((q) => (
                <tr key={q.quoteId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                      {q.quoteId}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-500 font-bold">{q.shipmentId}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">{q.customerName}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-800">
                    {q.originPort} → {q.destinationPort}
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 font-bold">{q.carrierName}</td>
                  <td className="py-3.5 px-3 font-black text-blue-700 text-sm">${q.finalQuoteUsd}</td>
                  <td className="py-3.5 px-3 font-black text-emerald-700">{q.marginPct}%</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                        q.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right space-x-2">
                    <button
                      onClick={() => handleOpenBreakdown(q)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      Cost Breakdown
                    </button>
                    {q.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleApprove(q.quoteId)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 12 Quote Detail & Breakdown Modal */}
      {selectedQuote && modalCalculations && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                    {selectedQuote.quoteId}
                  </span>
                  <h3 className="text-base font-black text-slate-900">Commercial Quotation Breakdown</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Shipment Ref: <span className="font-bold text-slate-800">{selectedQuote.shipmentId}</span> • Customer:{' '}
                  <span className="font-bold text-slate-800">{selectedQuote.customerName}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Shipment & Route Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase">Corridor</span>
                <p className="font-bold text-slate-900">{selectedQuote.originPort} → {selectedQuote.destinationPort}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase">Transit Time</span>
                <p className="font-bold text-slate-900">{selectedQuote.transitDays} Days</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase">Carrier</span>
                <p className="font-bold text-slate-900">{selectedQuote.carrierName}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase">Cargo & Container</span>
                <p className="font-bold text-slate-900">{selectedQuote.cargoType} • {selectedQuote.containerType}</p>
              </div>
            </div>

            {/* Cost Breakdown Table (Matching Step 12 Specification) */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                  Commercial Cost Line Breakdown
                </span>
                <span className="text-xs text-slate-400">Currency: USD ($)</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Base Freight Cost (Carrier Tarif):</span>
                  <span className="font-bold text-white">${selectedQuote.freightCostUsd}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Operational & Terminal Handling Cost:</span>
                  <span className="font-bold text-white">${selectedQuote.operationalCostUsd}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                  <span>Subtotal Net Carrier Cost:</span>
                  <span className="font-bold text-slate-200">${modalCalculations.costBase}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold pt-1">
                  <span>Broker Margin ({activeMarginPct}%):</span>
                  <span>+${modalCalculations.marginAmt}</span>
                </div>
                <div className="flex justify-between text-white font-black text-base pt-3 border-t border-slate-700">
                  <span>Final Commercial Quote:</span>
                  <span className="text-cyan-300">${modalCalculations.finalPrice}</span>
                </div>
              </div>
            </div>

            {/* Interactive Margin Adjustment Slider */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Adjust Commercial Margin Spread:</span>
                </label>
                <span className="text-sm font-black text-blue-700 bg-blue-100 px-3 py-0.5 rounded-lg">
                  {activeMarginPct}%
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                step={1}
                value={activeMarginPct}
                onChange={(e) => setActiveMarginPct(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>5% (Floor minimum)</span>
                <span>15% (Target default)</span>
                <span>30% (High yield)</span>
              </div>

              {activeMarginPct !== selectedQuote.marginPct && (
                <button
                  onClick={handleSaveMargin}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Apply & Save Margin Update (${modalCalculations.finalPrice})
                </button>
              )}
            </div>

            {/* Rejection Form if active */}
            {isRejecting && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Rejection Audit Reason:</span>
                </label>
                <textarea
                  rows={2}
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="e.g. Carrier rate expired, customer requested route revision..."
                  className="w-full bg-white border border-rose-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsRejecting(false)}
                    className="bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedQuote.quoteId)}
                    className="bg-rose-600 text-white font-black px-4 py-1.5 rounded-lg text-xs"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                {!isRejecting && selectedQuote.status !== 'REJECTED' && (
                  <button
                    onClick={() => setIsRejecting(true)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Quote</span>
                  </button>
                )}
              </div>

              {selectedQuote.status !== 'APPROVED' && (
                <button
                  onClick={() => handleApprove(selectedQuote.quoteId)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Release to Customer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
