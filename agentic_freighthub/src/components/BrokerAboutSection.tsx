import React from 'react';
import {
  Briefcase,
  ShieldCheck,
  TrendingUp,
  Globe2,
  Ship,
  Plane,
  Truck,
  CheckCircle2,
  DollarSign,
  Scale,
  Award,
  Layers
} from 'lucide-react';

export const BrokerAboutSection: React.FC = () => {
  return (
    <div id="about-section" className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200/80 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-xl shadow-md shadow-amber-500/20">
            <Briefcase className="w-6 h-6 fill-current text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-amber-700 uppercase bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                BROKERAGE NETWORK & INFRASTRUCTURE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Apex Freight Brokerage Intermediary Network
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Direct Wholesale Carrier Alliances, Dynamic Margin Control & Institutional Settlement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-900 text-amber-400 text-xs font-black rounded-xl border border-slate-800 flex items-center gap-1.5 shadow-sm">
            <Award className="w-3.5 h-3.5" />
            <span>FMC & FIATA ACCREDITED</span>
          </span>
        </div>
      </div>

      {/* Main Mission Paragraph */}
      <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/70">
        Apex Freight Brokerage operates as the premier digital intermediary backbone connecting licensed freight forwarders, cargo brokers, and logistics agents with direct Tier-1 vessel lines, air cargo operators, and inland carriers. Our platform arms brokers with real-time wholesale contract indices, precision spread modeling tools, and automated audit-compliant quotation generators.
      </div>

      {/* 3 Strategic Broker Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Pillar 1: Carrier Alliances */}
        <div className="bg-[#0F172A] text-white rounded-xl p-5 space-y-3.5 shadow-md border border-slate-800 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                <Ship className="w-5 h-5 text-amber-400" />
              </div>
              <span className="bg-slate-800 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border border-slate-700">
                TIER-1 ALLIANCES
              </span>
            </div>

            <h3 className="text-base font-black text-white">
              Direct Carrier Contract Procurement
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Direct bulk volume allocations across 2M+ TEUs with Maersk, MSC, CMA CGM, Hapag-Lloyd, Emirates SkyCargo, and Qatar Cargo at discounted wholesale buy-rates.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Guaranteed Peak Season Space Allocations</span>
          </div>
        </div>

        {/* Pillar 2: Dynamic Margin Studio */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/80 rounded-xl p-5 space-y-3.5 shadow-sm flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-amber-500 text-slate-950 rounded-lg shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="bg-amber-200/80 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                SPREAD ENGINE
              </span>
            </div>

            <h3 className="text-base font-black text-slate-900">
              Dynamic Margin & Spread Studio
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              Automated buy vs. sell price modeling with configurable markup spreads, fuel surcharge pass-throughs, customs handling buffers, and currency hedge protection.
            </p>
          </div>

          <div className="pt-3 border-t border-amber-200/60 flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <DollarSign className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Real-Time Net Profit Calculation</span>
          </div>
        </div>

        {/* Pillar 3: Automated Quote & Compliance */}
        <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-5 space-y-3.5 shadow-md flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <span className="bg-slate-800 text-blue-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border border-slate-700">
                COMPLIANCE READY
              </span>
            </div>

            <h3 className="text-base font-black text-white">
              Instant RFQ Review & Branded PDF
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Intercept shipper quote requests, calibrate final rates, and generate commercial PDF proposals with your brokerage contact credentials in one click.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-xs font-bold text-blue-400">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>100% Audit-Compliant Documentation</span>
          </div>
        </div>
      </div>

      {/* Broker Accreditations & Key Specs Strip */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 shrink-0">
            <Scale className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-black text-white">Licensed Non-Vessel Operating Common Carrier (NVOCC)</div>
            <div className="text-[11px] text-slate-400">Registered FMC Org #029410 • FIATA Multi-Modal Transport Operator License IN/942/2024</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-[10px] font-black px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            24 Corridors Monitored
          </span>
          <span className="text-[10px] font-black px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Automated GST/TDS Invoicing
          </span>
          <span className="text-[10px] font-black px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Zero Platform Lock-in
          </span>
        </div>
      </div>
    </div>
  );
};
