import React, { useState } from 'react';
import { Compass, MapPin, ArrowRight, Ship, Plane, Search } from 'lucide-react';
import { PORTS_AND_HUBS } from '../data/freightData';
import { getRouteDistanceAndTransit } from '../utils/calculator';

interface RoutesViewProps {
  onCalculateRoute: (origin: string, dest: string, mode: string) => void;
}

export const RoutesView: React.FC<RoutesViewProps> = ({ onCalculateRoute }) => {
  const [origin, setOrigin] = useState('INNSA');
  const [dest, setDest] = useState('AEJEA');
  const [mode, setMode] = useState('ocean');

  const routeInfo = getRouteDistanceAndTransit(origin, dest, mode);
  const originPort = PORTS_AND_HUBS.find((p) => p.code === origin);
  const destPort = PORTS_AND_HUBS.find((p) => p.code === dest);

  return (
    <div className="space-y-6">
      {/* Route Finder Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-600/30">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Global Port Distance Matrix & Trade Corridors
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Query nautical and airway distances between global gateways
            </p>
          </div>
        </div>

        {/* Port Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
              ORIGIN PORT / HUB
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800"
            >
              {PORTS_AND_HUBS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
              DESTINATION GATEWAY
            </label>
            <select
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800"
            >
              {PORTS_AND_HUBS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
              TRANSPORT MODE
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('ocean')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  mode === 'ocean' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Ocean FCL/LCL
              </button>
              <button
                type="button"
                onClick={() => setMode('air')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  mode === 'air' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Air Freight
              </button>
            </div>
          </div>
        </div>

        {/* Corridor Result Card */}
        <div className="bg-[#0F172A] text-white rounded-2xl p-6 space-y-4 shadow-xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                {mode === 'ocean' ? <Ship className="w-6 h-6" /> : <Plane className="w-6 h-6" />}
              </div>
              <div>
                <div className="text-lg font-black text-white flex items-center gap-2">
                  <span>{originPort?.locationLabel || origin}</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                  <span>{destPort?.locationLabel || dest}</span>
                </div>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <span>{originPort?.country}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span>{destPort?.country}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => onCalculateRoute(origin, dest, mode)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/30 shrink-0 flex items-center gap-1.5"
            >
              <span>Calculate Live Quote</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-center">
            <div className="bg-slate-900 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">ESTIMATED DISTANCE</span>
              <span className="text-lg font-black text-cyan-400">{routeInfo.distanceText}</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">PORT-TO-PORT TRANSIT</span>
              <span className="text-lg font-black text-emerald-400">{routeInfo.transitText}</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">CORRIDOR STATUS</span>
              <span className="text-lg font-black text-white">ACTIVE / SLA OPTIMIZED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
