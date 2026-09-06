import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import {
  Ship,
  Navigation,
  Compass,
  MapPin,
  Anchor,
  Globe,
  ExternalLink,
  Layers,
  Maximize2,
  Minimize2,
  Wind,
  Droplets,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Key,
  Info,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from 'lucide-react';

export interface LiveShipmentTrackingInfo {
  shipmentId: string;
  quotationId: string;
  customerName: string;
  originPort: string;
  originCode: string;
  originCoords: { lat: number; lng: number };
  destinationPort: string;
  destinationCode: string;
  destinationCoords: { lat: number; lng: number };
  cargoType: string;
  containerType: string;
  carrierName: string;
  vesselName: string;
  voyageNumber: string;
  status: 'IN_TRANSIT' | 'CUSTOMS_CLEARANCE' | 'ROUTE_READY' | 'DELIVERED';
  statusLabel: string;
  currentLocationName: string;
  currentCoords: { lat: number; lng: number };
  speedKnots: number;
  headingDegrees: number;
  progressPct: number;
  departureDate: string;
  eta: string;
  waypoints: Array<{ name: string; lat: number; lng: number; passed: boolean }>;
  seaConditions: string;
  waterTempC: number;
  distanceTotalNm: number;
  distanceRemainingNm: number;
  lastUpdated: string;
}

interface LiveGoogleMapTrackerProps {
  shipment: LiveShipmentTrackingInfo;
  onClose?: () => void;
  isModal?: boolean;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export const LiveGoogleMapTracker: React.FC<LiveGoogleMapTrackerProps> = ({
  shipment,
  onClose,
  isModal = false,
}) => {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('hybrid');
  const [showKeyInstructions, setShowKeyInstructions] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(5);
  const [activePin, setActivePin] = useState<'vessel' | 'origin' | 'destination' | null>('vessel');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const googleMapsWebUrl = `https://www.google.com/maps/search/?api=1&query=${shipment.currentCoords.lat},${shipment.currentCoords.lng}`;

  // Center on active vessel position
  const centerPosition = shipment.currentCoords;

  return (
    <div
      className={`bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'relative w-full'
      }`}
    >
      {/* Top Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                LIVE GOOGLE MAP AIS RADAR
              </span>
              <span className="text-xs font-black text-amber-400">
                Quote #{shipment.quotationId}
              </span>
              <span className="text-xs text-slate-400">• Shipment {shipment.shipmentId}</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5">
              <span>{shipment.vesselName}</span>
              <span className="text-xs text-slate-400 font-bold">({shipment.carrierName})</span>
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* External Google Map button */}
          <a
            href={googleMapsWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
            title="Open in Google Maps web application"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open in Google Maps</span>
          </a>

          {/* Toggle Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* API Key Instructions */}
          <button
            onClick={() => setShowKeyInstructions(!showKeyInstructions)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Google Maps API Config"
          >
            <Key className="w-4 h-4 text-amber-400" />
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* API Key Modal Guide (If toggled or needed) */}
      {showKeyInstructions && (
        <div className="bg-blue-950/90 border-b border-blue-800/80 p-4 text-xs text-blue-100 flex items-start justify-between gap-4 animate-fadeIn">
          <div className="space-y-1">
            <div className="font-black text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Google Maps Platform Integration Info</span>
            </div>
            <p className="text-blue-200">
              {hasValidKey
                ? '✅ Google Maps Platform Key is configured and active.'
                : 'Interactive vector/satellite mapping is active with full AIS radar simulation. You can optionally connect your custom Google Maps Platform key:'}
            </p>
            <p className="text-slate-300">
              Open <strong>Settings (⚙️ top-right) → Secrets → GOOGLE_MAPS_PLATFORM_KEY</strong> to add your custom key.
            </p>
          </div>
          <button
            onClick={() => setShowKeyInstructions(false)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Map View Area */}
      <div className="relative w-full h-[420px] sm:h-[500px] bg-slate-900 flex flex-col justify-end overflow-hidden">
        {hasValidKey ? (
          /* Native Google Maps Platform Component */
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={centerPosition}
              defaultZoom={zoomLevel}
              mapId="DEMO_MAP_ID"
              mapTypeId={mapType}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
              disableDefaultUI={false}
            >
              {/* Origin Port Pin */}
              <AdvancedMarker position={shipment.originCoords} title={`Origin: ${shipment.originPort}`}>
                <Pin background="#0284c7" glyphColor="#ffffff" borderColor="#0369a1" />
              </AdvancedMarker>

              {/* Destination Port Pin */}
              <AdvancedMarker position={shipment.destinationCoords} title={`Destination: ${shipment.destinationPort}`}>
                <Pin background="#10b981" glyphColor="#ffffff" borderColor="#047857" />
              </AdvancedMarker>

              {/* Live Vessel Marker */}
              <AdvancedMarker position={shipment.currentCoords} title={`Vessel: ${shipment.vesselName}`}>
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-8 h-8 rounded-full bg-cyan-400/40 animate-ping" />
                  <div className="w-8 h-8 rounded-full bg-cyan-500 border-2 border-white text-slate-950 flex items-center justify-center shadow-lg transform -rotate-45">
                    <Ship className="w-4 h-4 text-slate-950" />
                  </div>
                </div>
              </AdvancedMarker>
            </Map>
          </APIProvider>
        ) : (
          /* High-Fidelity Interactive Satellite & Marine Canvas Radar Map */
          <div className="absolute inset-0 w-full h-full bg-[#071322] flex flex-col">
            {/* Grid & Nautical Coordinate Grid Background */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 60%), linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)',
                backgroundSize: '100% 100%, 40px 40px, 40px 40px',
              }}
            />

            {/* Embedded Interactive Google Map Tile Canvas */}
            <iframe
              title="Google Map Live Tracking"
              className="w-full h-full border-0 filter contrast-125 saturate-110 opacity-75"
              src={`https://maps.google.com/maps?q=${shipment.currentCoords.lat},${shipment.currentCoords.lng}&t=${
                mapType === 'satellite' ? 'k' : mapType === 'hybrid' ? 'h' : 'm'
              }&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`}
              loading="lazy"
            />

            {/* SVG Nautical Route Polyline Layer Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg className="w-full h-full absolute inset-0 opacity-80" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                {/* Visual Corridor Trajectory Path */}
                <path
                  d="M 15% 45% Q 45% 65% 85% 55%"
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="4"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Floating Telemetry & Map Layer HUD Overlays */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {/* Map Layer Mode Buttons */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1 flex items-center gap-1 shadow-xl">
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-2.5 py-1 text-[11px] font-black rounded-xl transition-all ${
                mapType === 'roadmap' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 text-[11px] font-black rounded-xl transition-all ${
                mapType === 'satellite' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-2.5 py-1 text-[11px] font-black rounded-xl transition-all ${
                mapType === 'hybrid' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              Marine Hybrid
            </button>
          </div>

          {/* Quick Zoom Controls */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1 flex items-center gap-1 shadow-xl w-fit">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 1, 14))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 1, 3))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-black text-slate-400 px-1">{zoomLevel}x</span>
          </div>
        </div>

        {/* Live GPS Coordinates Radar Pill (Floating Top Right) */}
        <div className="absolute top-4 right-4 z-20 bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 rounded-2xl px-3.5 py-2 text-xs shadow-2xl flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <div className="text-[10px] text-cyan-300 font-extrabold uppercase tracking-wider">
              AIS POS: {shipment.currentCoords.lat.toFixed(4)}° N, {shipment.currentCoords.lng.toFixed(4)}° E
            </div>
            <div className="text-[11px] text-slate-300 font-bold">
              Speed: <span className="text-white font-black">{shipment.speedKnots} kn</span> • Heading: {shipment.headingDegrees}°
            </div>
          </div>
        </div>

        {/* Bottom Floating Telemetry Bar */}
        <div className="relative z-20 m-3 sm:m-4 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Origin */}
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                <Anchor className="w-3 h-3 text-blue-400" /> Origin Port
              </span>
              <p className="font-black text-white mt-0.5">{shipment.originPort} ({shipment.originCode})</p>
              <span className="text-[10px] text-slate-400 font-semibold">Dep: {shipment.departureDate}</span>
            </div>

            {/* Current Position */}
            <div>
              <span className="text-[10px] font-black text-cyan-400 uppercase flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" /> Current Position
              </span>
              <p className="font-black text-white mt-0.5 truncate">{shipment.currentLocationName}</p>
              <span className="text-[10px] text-cyan-300 font-bold">{shipment.progressPct}% Complete</span>
            </div>

            {/* Destination & ETA */}
            <div>
              <span className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" /> Destination & ETA
              </span>
              <p className="font-black text-white mt-0.5">{shipment.destinationPort} ({shipment.destinationCode})</p>
              <span className="text-[10px] text-emerald-300 font-black">ETA: {shipment.eta}</span>
            </div>

            {/* Distance & Sea State */}
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                <Wind className="w-3 h-3 text-amber-400" /> Sea & Distance
              </span>
              <p className="font-black text-white mt-0.5">{shipment.distanceRemainingNm} nm remaining</p>
              <span className="text-[10px] text-amber-300 font-semibold">{shipment.seaConditions}</span>
            </div>
          </div>

          {/* Voyage Progress Track */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
            <div className="flex justify-between text-[11px] font-black">
              <span className="text-slate-400">{shipment.originPort}</span>
              <span className="text-cyan-400 font-extrabold flex items-center gap-1">
                <Ship className="w-3.5 h-3.5 animate-bounce" />
                {shipment.vesselName} ({shipment.speedKnots} knots)
              </span>
              <span className="text-slate-400">{shipment.destinationPort}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${shipment.progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Waypoint Milestones Timeline */}
      <div className="p-4 sm:p-5 bg-slate-900/60 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Voyage Waypoints & Maritime Checkpoints
          </span>
          <span className="text-xs text-slate-400">
            Last AIS Ping: <strong className="text-white">{shipment.lastUpdated}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(shipment?.waypoints || []).map((wp, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border text-xs ${
                wp.passed
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase">WP {idx + 1}</span>
                {wp.passed ? (
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                    Passed ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500">Upcoming</span>
                )}
              </div>
              <p className="font-black text-white mt-1">{wp.name}</p>
              <span className="text-[10px] text-slate-400 font-mono">
                {wp.lat.toFixed(2)}°N, {wp.lng.toFixed(2)}°E
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
