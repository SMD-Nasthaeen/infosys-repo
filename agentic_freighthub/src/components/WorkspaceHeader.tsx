import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface WorkspaceHeaderProps {
  quoteCount: number;
  userName?: string;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ quoteCount, userName = 'Aparajita' }) => {
  return (
    <div className="bg-[#0F172A] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="space-y-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-blue-900/60 text-blue-400 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-blue-700/50">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>AUTHENTICATED USER WORKSPACE</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          User Freight Quote Generation System
        </h1>

        <p className="text-xs text-slate-300 font-medium leading-relaxed">
          Welcome back <span className="text-white font-bold">{userName}</span>. Select date, destination, cargo parameters and generate instant commercial freight quotes.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center min-w-[120px]">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SAVED QUOTES</div>
          <div className="text-xl font-black text-amber-400 mt-1">{quoteCount} Issued</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center min-w-[120px]">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TARIFF ENGINE</div>
          <div className="text-xl font-black text-emerald-400 mt-1">Live</div>
        </div>
      </div>
    </div>
  );
};
