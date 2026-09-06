import React, { useState } from 'react';
import {
  Ship,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Compass,
  ArrowRight,
  Filter,
  Eye,
  RefreshCw,
  Building,
  Anchor,
  Box,
  Truck,
  DollarSign
} from 'lucide-react';
import { INITIAL_SHIPMENTS, ShipmentRecord, RouteOption } from '../data/shipmentData';

interface Milestone1RouteOperationsViewProps {
  onSendToPricing?: (shipment: ShipmentRecord) => void;
}

export const Milestone1RouteOperationsView: React.FC<Milestone1RouteOperationsViewProps> = ({
  onSendToPricing,
}) => {
  const [shipments, setShipments] = useState<ShipmentRecord[]>(INITIAL_SHIPMENTS);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ROUTE_READY' | 'ROUTE_PROCESSING' | 'REQUESTED'>('ALL');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Metrics from specification (Milestone 1 Step 6)
  const totalShipments = 120;
  const routeProcessing = 25;
  const routesRecommended = 82;
  const pendingShipments = 13;

  const filteredShipments = shipments.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.id.toLowerCase().includes(term) ||
      s.customerName.toLowerCase().includes(term) ||
      s.originPort.toLowerCase().includes(term) ||
      s.destinationPort.toLowerCase().includes(term) ||
      (s.recommendedRoute?.carrierName || '').toLowerCase().includes(term)
    );
  });

  const handleSelectRouteOption = (shipmentId: string, route: RouteOption) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === shipmentId ? { ...s, selectedRoute: route } : s))
    );
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment((prev) => (prev ? { ...prev, selectedRoute: route } : null));
    }
    setSuccessToast(`Selected ${route.name} (${route.carrierName}) for ${shipmentId}`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Route Operations & Corridor Desk</h2>
            <p className="text-xs text-slate-300 mt-1">
              Corridor route intelligence, autonomous transit estimation, and carrier comparisons
            </p>
          </div>
        </div>

        {/* Step 6 Specification Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Shipments</span>
            <span className="text-2xl font-black text-white mt-0.5 block">{totalShipments}</span>
            <span className="text-[11px] text-slate-400">Logged in pipeline</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">Route Processing</span>
            <span className="text-2xl font-black text-amber-400 mt-0.5 block">{routeProcessing}</span>
            <span className="text-[11px] text-slate-400">Agent evaluating schedules</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Routes Recommended</span>
            <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{routesRecommended}</span>
            <span className="text-[11px] text-slate-400">Optimal corridors ready</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider block">Pending</span>
            <span className="text-2xl font-black text-purple-400 mt-0.5 block">{pendingShipments}</span>
            <span className="text-[11px] text-slate-400">Awaiting customer review</span>
          </div>
        </div>
      </div>

      {/* Shipment Records Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID, customer, corridor, carrier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 md:w-80"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['ALL', 'ROUTE_READY', 'ROUTE_PROCESSING', 'REQUESTED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === filter ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs font-bold text-slate-500">
            Showing <span className="text-slate-900">{filteredShipments.length}</span> active shipments
          </span>
        </div>

        {/* Step 6 Shipment Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Shipment</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Route</th>
                <th className="py-3 px-3">Transit</th>
                <th className="py-3 px-3">Carrier</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredShipments.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                      {s.id}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">{s.customerName}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-800">
                    {s.originPort} → {s.destinationPort}
                  </td>
                  <td className="py-3.5 px-3 font-black text-slate-900">
                    {s.recommendedRoute?.transitDays ? `${s.recommendedRoute.transitDays} Days` : '9 Days'}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-700">
                    {s.recommendedRoute?.carrierName || (s.id === 'SHP002' ? 'XYZ Shipping' : 'ABC Shipping')}
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                        s.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.status === 'ROUTE_READY'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {s.status === 'ROUTE_READY'
                        ? 'Route Ready'
                        : s.status === 'ROUTE_PROCESSING' || s.status === 'REQUESTED'
                        ? 'Processing'
                        : s.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right space-x-2">
                    <button
                      onClick={() => setSelectedShipment(s)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      Open Details
                    </button>
                    {onSendToPricing && (
                      <button
                        onClick={() => onSendToPricing(s)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Price Quote
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipment Details & Step 6 Route Options Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                    {selectedShipment.id}
                  </span>
                  <h3 className="text-base font-black text-slate-900">Shipment Details & M1 Route Agent</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Customer: <span className="font-bold text-slate-700">{selectedShipment.customerName}</span> ({selectedShipment.customerId})
                </p>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1. Shipment Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black flex items-center justify-center">1</span>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Shipment Details</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase">Origin Port</span>
                  <p className="font-bold text-slate-900">{selectedShipment.originPort} ({selectedShipment.originCode})</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase">Destination Port</span>
                  <p className="font-bold text-slate-900">{selectedShipment.destinationPort} ({selectedShipment.destinationCode})</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase">Cargo Type</span>
                  <p className="font-bold text-slate-900">{selectedShipment.cargoType}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase">Container Type</span>
                  <p className="font-bold text-slate-900">{selectedShipment.containerType}</p>
                </div>
              </div>
            </div>

            {/* 2. Route Options */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-black flex items-center justify-center">2</span>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Route Options ({(selectedShipment.routeOptions || []).length} Generated)
                </h4>
              </div>
              <div className="space-y-2.5">
                {(selectedShipment.routeOptions || []).map((opt) => {
                  const isChosen = selectedShipment.selectedRoute?.id === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isChosen
                          ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400/40'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{opt.name}</span>
                          <span className="text-xs font-bold text-slate-600">({opt.carrierName})</span>
                          {opt.isRecommended && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                              ★ Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          {opt.path} • {opt.transshipmentType} (Reliability: {opt.reliabilityScore}%)
                        </p>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <div className="text-right">
                          <span className="font-black text-sm text-slate-900">{opt.transitDays} Days</span>
                          <span className="block text-[10px] text-slate-400">${opt.baseFreightCostUsd} Base</span>
                        </div>
                        <button
                          onClick={() => handleSelectRouteOption(selectedShipment.id, opt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                            isChosen
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isChosen ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3, 4, 5. Recommended Route, Transit Time & Carrier */}
            {selectedShipment.recommendedRoute && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">3</span>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Recommended Route • Transit Time • Carrier
                  </h4>
                </div>

                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">
                      ★ Optimal Corridors Recommendation
                    </span>
                    <span className="bg-cyan-400 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      M1 Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
                      <span className="text-[10px] text-cyan-200 uppercase font-black block">Recommended Route</span>
                      <span className="font-black text-sm text-white mt-0.5 block">{selectedShipment.recommendedRoute.path}</span>
                      <span className="text-[11px] text-blue-200 mt-1 block">{selectedShipment.recommendedRoute.transshipmentType}</span>
                    </div>

                    <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
                      <span className="text-[10px] text-cyan-200 uppercase font-black block">Transit Time</span>
                      <span className="font-black text-lg text-white mt-0.5 block">{selectedShipment.recommendedRoute.transitDays} Days</span>
                      <span className="text-[11px] text-blue-200 mt-1 block">Reliability: {selectedShipment.recommendedRoute.reliabilityScore}%</span>
                    </div>

                    <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
                      <span className="text-[10px] text-cyan-200 uppercase font-black block">Carrier</span>
                      <span className="font-black text-sm text-white mt-0.5 block">{selectedShipment.recommendedRoute.carrierName}</span>
                      <span className="text-[11px] text-blue-200 mt-1 block">Code: {selectedShipment.recommendedRoute.carrierCode}</span>
                    </div>
                  </div>

                  {selectedShipment.recommendedRoute.recommendationReason && (
                    <p className="text-[11px] text-cyan-200 bg-blue-950/70 p-3 rounded-xl border border-blue-800/60">
                      {selectedShipment.recommendedRoute.recommendationReason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedShipment(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Close
              </button>
              {onSendToPricing && (
                <button
                  onClick={() => {
                    const shp = selectedShipment;
                    setSelectedShipment(null);
                    onSendToPricing(shp);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Generate Quotation</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
