import React from 'react';
import { BarChart3, TrendingDown, TrendingUp, ShieldCheck, Globe, ArrowRight } from 'lucide-react';
import { BENCHMARK_CORRIDORS } from '../data/freightData';

interface ReferenceDashboardProps {
  onSelectCorridor?: (origin: string, dest: string, mode: string) => void;
}

export const ReferenceDashboard: React.FC<ReferenceDashboardProps> = ({ onSelectCorridor }) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 mb-8 space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Reference Logistics Dashboard</h2>
            <p className="text-xs font-semibold text-slate-500">
              Public Market Analytics & Transport Tariff Benchmarks
            </p>
          </div>
        </div>

        <div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            MARKET INDEX 2026
          </span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#0F172A] text-white rounded-2xl p-5 space-y-3 shadow-md border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            AVERAGE OCEAN FREIGHT INDEX
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">₹ 1,92,250</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" /> 4.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Per 40HC Container (Nhava Sheva to Jebel Ali)</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3 shadow-sm">
          <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
            AIR FREIGHT TARIFF INDEX
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">₹ 250 / kg</span>
            <span className="text-xs font-bold text-blue-600 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> 1.8%
            </span>
          </div>
          <p className="text-[11px] text-slate-600">Chargeable Weight (BOM to Dubai DXB)</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-emerald-950 text-white rounded-2xl p-5 space-y-3 shadow-md border border-emerald-900">
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
            GLOBAL TRANSIT EFFICIENCY
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">98.4%</span>
            <span className="text-xs font-bold text-emerald-300">On-Time</span>
          </div>
          <p className="text-[11px] text-emerald-200">Port-to-Port SLA Tracking Metric</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-3 shadow-sm">
          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
            MONITORED TRADE CORRIDORS
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">14 Major Ports</span>
          </div>
          <p className="text-[11px] text-slate-600">India, Gulf, Europe, Singapore & US</p>
        </div>
      </div>

      {/* Corridor Tariff Matrix Table */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
          <Globe className="w-4 h-4" />
          <span>Reference Corridor Tariff Matrix (INR)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">ORIGIN HUB</th>
                <th className="py-3 px-4">DESTINATION GATEWAY</th>
                <th className="py-3 px-4">TRANSPORT MODE</th>
                <th className="py-3 px-4">TRANSIT TIME</th>
                <th className="py-3 px-4">BENCHMARK RATE (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
              {BENCHMARK_CORRIDORS.map((corridor, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-white transition-colors cursor-pointer"
                  onClick={() =>
                    onSelectCorridor &&
                    onSelectCorridor(corridor.originCode, corridor.destinationCode, corridor.mode)
                  }
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900">{corridor.originCode}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{corridor.destinationCode}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        corridor.mode.includes('Ocean')
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {corridor.mode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-600">{corridor.transitTime}</td>
                  <td className="py-3.5 px-4 font-black text-slate-900">{corridor.rateInr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
