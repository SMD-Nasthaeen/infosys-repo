import React from 'react';
import { HelpCircle, Globe, Link2, ShieldCheck, Check, Zap } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <div id="about-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 mb-8 space-y-6">
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-600/30">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">About Intelligent Freight System</h2>
          <p className="text-xs font-semibold text-slate-500">
            Automated Quotation Architecture & Port Distance Engine
          </p>
        </div>
      </div>

      {/* 3 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Dark Navy Card */}
        <div className="bg-[#0F172A] text-white rounded-2xl p-6 space-y-4 shadow-lg border border-slate-800 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-900/60 text-blue-400 rounded-xl border border-blue-700/50">
                <Globe className="w-5 h-5" />
              </div>
              <span className="bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider">
                NAUTICAL MATRIX
              </span>
            </div>

            <h3 className="text-lg font-black text-white">Global Port Distance Matrix</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Calculates precise nautical and airway distances between major Indian hubs (Nhava Sheva,
              Mumbai BOM, Delhi DEL, Chennai MAA) and global international gateways.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs font-bold text-cyan-400">
            <Check className="w-4 h-4 text-cyan-400" />
            <span>14 International Trade Corridors Monitored</span>
          </div>
        </div>

        {/* Card 2: Light Blue/Purple Card */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/30">
                <Link2 className="w-5 h-5" />
              </div>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                TRANSPARENT TARIFFS
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Transparent Multi-Currency Tariff Breakdown
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Computes base ocean/air tariffs, bunker adjustment factors (BAF), terminal handling charges (THC),
              and fuel surcharges in your selected currency with itemized audit records.
            </p>
          </div>

          <div className="pt-3 flex items-center gap-2 text-xs font-bold text-indigo-700">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Automated Currency & Fuel Adjustment Engine</span>
          </div>
        </div>
      </div>

      {/* Card 3: Wide Light Green Card */}
      <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/30 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Automated Commercial Quotation Engine
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Generates instant export-ready quote PDFs and records historical quotation logs for commercial
              auditing and freight forwarder compliance.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <span className="bg-emerald-600 text-white font-extrabold text-xs px-4 py-2 rounded-full uppercase tracking-wider shadow-md shadow-emerald-600/20">
            100% AUDIT COMPLIANCE
          </span>
        </div>
      </div>
    </div>
  );
};
