import React, { useState, useMemo } from 'react';
import {
  Radar,
  Search,
  Ship,
  CheckCircle2,
  Clock,
  Anchor,
  MapPin,
  Navigation,
  ArrowRight,
  Globe,
  Compass,
  Layers,
  ExternalLink,
  Tag,
  Filter,
  FileText,
  Building,
  Eye,
  Crosshair,
  AlertCircle,
  Radio,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { LiveGoogleMapTracker, LiveShipmentTrackingInfo } from './LiveGoogleMapTracker';
import { INITIAL_TRACKING_RECORDS } from '../data/freightData';
import { INITIAL_SHIPMENTS } from '../data/shipmentData';
import { UserRole } from '../types';

export interface TrackingViewProps {
  initialSearchQuoteId?: string;
  userRole?: UserRole;
  onViewQuotationPdf?: (quoteId: string) => void;
  onOpenCreateShipment?: () => void;
}

// Master Unified Live Tracking Data combining Shipments, Quotations & AIS Marine Records
const UNIFIED_TRACKING_RECORDS: LiveShipmentTrackingInfo[] = [
  {
    shipmentId: 'SHP001',
    quotationId: 'Q001',
    customerName: 'ABC Logistics',
    originPort: 'Chennai',
    originCode: 'INMAA',
    originCoords: { lat: 13.0827, lng: 80.2707 },
    destinationPort: 'Singapore',
    destinationCode: 'SGSIN',
    destinationCoords: { lat: 1.3521, lng: 103.8198 },
    cargoType: 'Electronics',
    containerType: '40FT High Cube',
    carrierName: 'ABC Shipping',
    vesselName: 'MV ABC PHOENIX / V.049E',
    voyageNumber: 'VOY-2026-0816',
    status: 'IN_TRANSIT',
    statusLabel: 'Vessel En Route via Malacca Strait',
    currentLocationName: 'Bay of Bengal — 8.7832° N, 89.2411° E',
    currentCoords: { lat: 8.7832, lng: 89.2411 },
    speedKnots: 19.4,
    headingDegrees: 114,
    progressPct: 68,
    departureDate: '2026-08-16',
    eta: '2026-08-25',
    waypoints: [
      { name: 'Chennai Port Container Berth (INMAA)', lat: 13.0827, lng: 80.2707, passed: true },
      { name: 'Andaman Sea Channel Checkpoint', lat: 10.1200, lng: 92.4500, passed: true },
      { name: 'Malacca Strait North Approach', lat: 5.4164, lng: 99.0833, passed: false },
      { name: 'Port of Singapore PSA Gate (SGSIN)', lat: 1.3521, lng: 103.8198, passed: false },
    ],
    seaConditions: 'Calm • 0.8m Swell',
    waterTempC: 28.5,
    distanceTotalNm: 1580,
    distanceRemainingNm: 505,
    lastUpdated: 'Just now (Live AIS Ping)',
  },
  {
    shipmentId: 'SHP002',
    quotationId: 'Q002',
    customerName: 'XYZ Logistics',
    originPort: 'Chennai',
    originCode: 'INMAA',
    originCoords: { lat: 13.0827, lng: 80.2707 },
    destinationPort: 'Dubai (Jebel Ali)',
    destinationCode: 'AEJEA',
    destinationCoords: { lat: 25.0112, lng: 55.0617 },
    cargoType: 'General Cargo',
    containerType: '20FT Dry Box',
    carrierName: 'XYZ Shipping',
    vesselName: 'MV XYZ PIONEER / V.102W',
    voyageNumber: 'VOY-2026-0818',
    status: 'IN_TRANSIT',
    statusLabel: 'Cruising Arabian Sea towards Gulf of Oman',
    currentLocationName: 'Arabian Sea — 15.4210° N, 67.2340° E',
    currentCoords: { lat: 15.4210, lng: 67.2340 },
    speedKnots: 17.8,
    headingDegrees: 295,
    progressPct: 52,
    departureDate: '2026-08-16',
    eta: '2026-08-28',
    waypoints: [
      { name: 'Chennai Port Berth 2 (INMAA)', lat: 13.0827, lng: 80.2707, passed: true },
      { name: 'Cape Comorin Sea Corridor', lat: 7.9500, lng: 77.5500, passed: true },
      { name: 'Strait of Hormuz Gate', lat: 26.5667, lng: 56.2500, passed: false },
      { name: 'Jebel Ali Terminal 3 (AEJEA)', lat: 25.0112, lng: 55.0617, passed: false },
    ],
    seaConditions: 'Moderate • 1.4m Swell',
    waterTempC: 29.1,
    distanceTotalNm: 2240,
    distanceRemainingNm: 1075,
    lastUpdated: '2 mins ago',
  },
  {
    shipmentId: 'SHP003',
    quotationId: 'QT-2026-00933',
    customerName: 'Global Freight Corp (Nordic Imports)',
    originPort: 'Nhava Sheva (Mumbai)',
    originCode: 'INNSA',
    originCoords: { lat: 18.9498, lng: 72.9515 },
    destinationPort: 'Rotterdam',
    destinationCode: 'NLRTM',
    destinationCoords: { lat: 51.9244, lng: 4.4777 },
    cargoType: 'Industrial Pumps',
    containerType: '40HC Heavy Lift',
    carrierName: 'Maersk Line Alliance',
    vesselName: 'MAERSK SELETAR / V.2026',
    voyageNumber: 'MAEU-EUR-2026',
    status: 'IN_TRANSIT',
    statusLabel: 'En Route across Gulf of Aden towards Red Sea',
    currentLocationName: 'Gulf of Aden — 12.8719° N, 51.4281° E',
    currentCoords: { lat: 12.8719, lng: 51.4281 },
    speedKnots: 20.6,
    headingDegrees: 280,
    progressPct: 44,
    departureDate: '2026-08-12',
    eta: '2026-09-07',
    waypoints: [
      { name: 'Nhava Sheva BMCT Berth 4 (INNSA)', lat: 18.9498, lng: 72.9515, passed: true },
      { name: 'Gulf of Aden Transit Corridor', lat: 12.8719, lng: 51.4281, passed: true },
      { name: 'Suez Canal Convoy (Port Said)', lat: 31.2653, lng: 32.3019, passed: false },
      { name: 'Rotterdam Europort Gate 2 (NLRTM)', lat: 51.9244, lng: 4.4777, passed: false },
    ],
    seaConditions: 'Choppy • 2.1m Wind Wave',
    waterTempC: 30.2,
    distanceTotalNm: 6350,
    distanceRemainingNm: 3556,
    lastUpdated: '1 min ago',
  },
  {
    shipmentId: 'SHP004',
    quotationId: 'QT-2026-00932',
    customerName: 'Gulf Machinery LLC',
    originPort: 'Mumbai (BOM Air)',
    originCode: 'BOM',
    originCoords: { lat: 19.0896, lng: 72.8656 },
    destinationPort: 'Dubai (DXB Air)',
    destinationCode: 'DXB',
    destinationCoords: { lat: 25.2532, lng: 55.3657 },
    cargoType: 'Air Cargo Spare Parts',
    containerType: 'Air Cargo Pallet ULD',
    carrierName: 'Emirates SkyCargo',
    vesselName: 'BOEING 777-F / EK-501',
    voyageNumber: 'EK-CARGO-501',
    status: 'CUSTOMS_CLEARANCE',
    statusLabel: 'Arrived at DWC Terminal. Under Import Duty Clearance.',
    currentLocationName: 'Dubai Airport Freezone — 25.2532° N, 55.3657° E',
    currentCoords: { lat: 25.2532, lng: 55.3657 },
    speedKnots: 0,
    headingDegrees: 0,
    progressPct: 88,
    departureDate: '2026-08-09',
    eta: '2026-08-18',
    waypoints: [
      { name: 'BOM Air Cargo Complex', lat: 19.0896, lng: 72.8656, passed: true },
      { name: 'Arabian Flight Waypoint OMAKO', lat: 22.1000, lng: 64.2000, passed: true },
      { name: 'DXB SkyCargo Bonded Vaults', lat: 25.2532, lng: 55.3657, passed: true },
      { name: 'JAFZA Freezone Door Delivery', lat: 24.9850, lng: 55.0800, passed: false },
    ],
    seaConditions: 'Airport Runway • Clear',
    waterTempC: 36.0,
    distanceTotalNm: 1040,
    distanceRemainingNm: 15,
    lastUpdated: '5 mins ago',
  },
  {
    shipmentId: 'SHP005',
    quotationId: 'QT-2026-00931',
    customerName: 'Sharma Textiles',
    originPort: 'Nhava Sheva (Mumbai)',
    originCode: 'INNSA',
    originCoords: { lat: 18.9498, lng: 72.9515 },
    destinationPort: 'Dubai (Jebel Ali)',
    destinationCode: 'AEJEA',
    destinationCoords: { lat: 25.0112, lng: 55.0617 },
    cargoType: 'Cotton Textiles',
    containerType: '40HC Container',
    carrierName: 'CMA CGM Ocean Alliance',
    vesselName: 'CMA CGM MAUPASSANT / V.024N',
    voyageNumber: 'CMDU-2026-0811',
    status: 'IN_TRANSIT',
    statusLabel: 'Container Loaded. Vessel En Route to Jebel Ali.',
    currentLocationName: 'Arabian Sea — 18.2910° N, 68.4019° E',
    currentCoords: { lat: 18.2910, lng: 68.4019 },
    speedKnots: 18.2,
    headingDegrees: 285,
    progressPct: 60,
    departureDate: '2026-08-11',
    eta: '2026-08-18',
    waypoints: [
      { name: 'Nhava Sheva BMCT (INNSA)', lat: 18.9498, lng: 72.9515, passed: true },
      { name: 'Mid Arabian Sea Waypoint', lat: 18.2910, lng: 68.4019, passed: true },
      { name: 'Strait of Hormuz Channel', lat: 26.5667, lng: 56.2500, passed: false },
      { name: 'Jebel Ali Terminal 1 (AEJEA)', lat: 25.0112, lng: 55.0617, passed: false },
    ],
    seaConditions: 'Moderate • 1.2m Swell',
    waterTempC: 29.5,
    distanceTotalNm: 1060,
    distanceRemainingNm: 424,
    lastUpdated: '3 mins ago',
  },
];

export const TrackingView: React.FC<TrackingViewProps> = ({
  initialSearchQuoteId = '',
  userRole = 'user',
  onViewQuotationPdf,
  onOpenCreateShipment,
}) => {
  // Search query (Supports quotation number, shipment ID, container no, customer)
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuoteId);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Quick Quotation Preset Chips
  const popularQuotations = ['Q001', 'Q002', 'QT-2026-00933', 'QT-2026-00932', 'QT-2026-00931'];

  // Filtered shipments based on search (quotation number, shipment ID, customer, etc.)
  const filteredShipments = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return (UNIFIED_TRACKING_RECORDS || []).filter((s) => {
      if (!s) return false;
      // Status filter
      if (selectedStatusFilter !== 'ALL' && s.status !== selectedStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (s.quotationId || '').toLowerCase().includes(q) ||
        (s.shipmentId || '').toLowerCase().includes(q) ||
        (s.customerName || '').toLowerCase().includes(q) ||
        (s.originPort || '').toLowerCase().includes(q) ||
        (s.destinationPort || '').toLowerCase().includes(q) ||
        (s.carrierName || '').toLowerCase().includes(q) ||
        (s.vesselName || '').toLowerCase().includes(q) ||
        (s.voyageNumber || '').toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Search & Live AIS Counter */}
      <div className="bg-[#0F172A] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
              <Radar className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  AIS LIVE GLOBAL FLEET
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                SHIPMENT & QUOTATION TRACKING
              </h2>
              <p className="text-xs text-slate-300">
                Search by <strong>Quotation Number</strong> or <strong>Shipment ID</strong> to trace real-time cargo status and corridor progress.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-700/80 px-4 py-2 rounded-2xl flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">ACTIVE SHIPS</span>
                <span className="text-xs font-black text-white">{UNIFIED_TRACKING_RECORDS.length} Vessels Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Universal Search Input (Specifically highlighting Quotation Number search) */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 text-cyan-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search by Quotation Number (e.g. Q001, Q002, QT-2026-00933), Shipment ID, Carrier, or Port..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border-2 border-slate-700 hover:border-slate-600 focus:border-cyan-400 rounded-2xl pl-12 pr-10 py-3.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none font-bold transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Quotation Number Chips & Filter Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-black text-slate-400 uppercase mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-cyan-400" /> Quotation Numbers:
              </span>
              {(popularQuotations || []).map((quoteCode) => (
                <button
                  key={quoteCode}
                  onClick={() => setSearchQuery(quoteCode)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    searchQuery.toLowerCase() === quoteCode.toLowerCase()
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  #{quoteCode}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700 p-1 rounded-xl">
              <button
                onClick={() => setSelectedStatusFilter('ALL')}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                  selectedStatusFilter === 'ALL' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedStatusFilter('IN_TRANSIT')}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                  selectedStatusFilter === 'IN_TRANSIT' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                In Transit
              </button>
              <button
                onClick={() => setSelectedStatusFilter('CUSTOMS_CLEARANCE')}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                  selectedStatusFilter === 'CUSTOMS_CLEARANCE' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Customs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* All Shipments Live Tracking Table / Grid */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Ship className="w-5 h-5 text-blue-600" />
              <span>All Active Shipments Tracking List</span>
              <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                {filteredShipments.length} Records
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Each shipment features real-time milestone progress, AIS telemetry, and estimated arrival updates.
            </p>
          </div>
        </div>

        {filteredShipments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Search className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-black text-slate-700">No shipments found for "{searchQuery}"</h4>
            <p className="text-xs text-slate-500">
              Try searching with Quotation Number like <strong>Q001</strong>, <strong>Q002</strong>, or <strong>QT-2026-00933</strong>.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl"
            >
              Reset Search Filter
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {(filteredShipments || []).map((shipment) => (
              <div
                key={shipment.shipmentId}
                className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 hover:border-blue-300 rounded-3xl p-5 sm:p-6 transition-all shadow-xs hover:shadow-md space-y-4"
              >
                {/* Header Row: Shipment, Quotation, Customer, Status & Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Shipment ID */}
                    <span className="text-base font-black text-slate-900">{shipment.shipmentId}</span>

                    {/* Quotation Number Badge */}
                    <div className="bg-amber-100/90 text-amber-900 border border-amber-300/80 text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-xs">
                      <FileText className="w-3.5 h-3.5 text-amber-700" />
                      <span>Quotation #{shipment.quotationId}</span>
                    </div>

                    {/* Customer Name */}
                    <div className="bg-slate-200/70 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>{shipment.customerName}</span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        shipment.status === 'IN_TRANSIT'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : shipment.status === 'CUSTOMS_CLEARANCE'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {shipment.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Actions: Quotation PDF / Details */}
                  {onViewQuotationPdf && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewQuotationPdf(shipment.quotationId)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-2xl transition-colors cursor-pointer"
                        title="View Quotation breakdown"
                      >
                        <FileText className="w-3.5 h-3.5 inline mr-1" />
                        Quote View
                      </button>
                    </div>
                  )}
                </div>

                {/* Corridor & Vessel Telemetry Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 text-xs">
                  {/* Route */}
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase block">Port Corridor</span>
                    <div className="font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <span>{shipment.originPort}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{shipment.destinationPort}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">{shipment.cargoType} • {shipment.containerType}</span>
                  </div>

                  {/* Vessel & Carrier */}
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase block">Carrier & Vessel</span>
                    <div className="font-bold text-slate-900 mt-0.5 truncate">{shipment.vesselName}</div>
                    <span className="text-[10px] text-blue-600 font-bold">{shipment.carrierName}</span>
                  </div>

                  {/* Live Coordinates */}
                  <div>
                    <span className="text-[10px] font-black text-cyan-600 uppercase block">Current AIS GPS</span>
                    <div className="font-black text-slate-900 mt-0.5 flex items-center gap-1">
                      <Crosshair className="w-3 h-3 text-cyan-500" />
                      <span className="font-mono text-[11px]">{shipment.currentCoords.lat.toFixed(2)}°N, {shipment.currentCoords.lng.toFixed(2)}°E</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">{shipment.speedKnots} kn • {shipment.seaConditions}</span>
                  </div>

                  {/* ETA & Progress */}
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase block">Estimated Arrival</span>
                    <div className="font-black text-emerald-600 mt-0.5 text-sm">{shipment.eta}</div>
                    <span className="text-[10px] text-slate-500 font-semibold">{shipment.distanceRemainingNm} nm remaining ({shipment.progressPct}%)</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-600">{shipment.statusLabel}</span>
                    <span className="text-blue-600 font-extrabold">{shipment.progressPct}% Completed</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${shipment.progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
