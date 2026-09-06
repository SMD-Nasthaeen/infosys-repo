import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Anchor,
  Globe2,
  Leaf,
  DollarSign,
  Headphones,
  Sparkles,
  Info,
  Clock,
  CheckCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const MarketIntelligenceWidget: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'AED'>('USD');
  const [fxAmount, setFxAmount] = useState<number>(1000);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const fxRates: Record<'USD' | 'EUR' | 'AED', { rate: number; symbol: string; change: string }> = {
    USD: { rate: 83.65, symbol: '$', change: '+0.04%' },
    EUR: { rate: 91.20, symbol: '€', change: '-0.12%' },
    AED: { rate: 22.78, symbol: 'AED', change: '0.00%' },
  };

  const convertedInr = Math.round(fxAmount * fxRates[selectedCurrency].rate);

  const portAdvisories = [
    { port: 'Nhava Sheva (INNSA)', status: 'Fluid', wait: '1.1 days', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { port: 'Jebel Ali (AEJEA)', status: 'Moderate', wait: '1.8 days', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { port: 'Rotterdam (NLRTM)', status: 'Optimal', wait: '0.8 days', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { port: 'Singapore (SGSIN)', status: 'Normal', wait: '1.2 days', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  ];

  const handleCopyHotline = () => {
    navigator.clipboard.writeText('+91 22 8800 4492');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* SECTION 1: GLOBAL BUNKER FUEL INDEX (BAF) */}
      <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white rounded-3xl p-4 shadow-md border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600/30 text-cyan-400 rounded-lg border border-blue-500/40">
              <Anchor className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-black tracking-wider uppercase text-slate-300">
                GLOBAL BUNKER FUEL (BAF)
              </div>
              <div className="text-[9px] text-slate-400">VLSFO Marine Index (Rotterdam/Singapore)</div>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <TrendingDown className="w-3 h-3" />
            -1.4%
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-xl font-black text-white tracking-tight">$614.50</span>
            <span className="text-[10px] text-slate-400 font-medium ml-1">/ Metric Ton</span>
          </div>
          <span className="text-[10px] font-bold text-cyan-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
            BAF Low Surcharge
          </span>
        </div>
      </div>

      {/* SECTION 2: PORT CONGESTION & GATE RADAR */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>PORT GATE & BERTH RADAR</span>
          </div>
          <span className="text-emerald-600 font-extrabold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            LIVE
          </span>
        </div>

        <div className="space-y-2">
          {portAdvisories.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors text-xs"
            >
              <span className="font-bold text-slate-800 text-[11px] truncate max-w-[130px]">
                {item.port}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-medium">~{item.wait}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${item.color}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: LIVE FX CURRENCY CONVERTER */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-700 uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
            <span>COMMERCIAL FX CONVERTER</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400">RBI Benchmark</span>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
          {(['USD', 'EUR', 'AED'] as const).map((curr) => (
            <button
              key={curr}
              onClick={() => setSelectedCurrency(curr)}
              className={`py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                selectedCurrency === curr
                  ? 'bg-white shadow text-blue-600 border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-bold">{fxRates[selectedCurrency].symbol}</span>
            <input
              type="number"
              min="1"
              value={fxAmount}
              onChange={(e) => setFxAmount(Number(e.target.value) || 0)}
              className="w-16 bg-transparent font-black text-slate-900 focus:outline-none"
            />
          </div>
          <span className="text-slate-400 font-bold text-[11px]">=</span>
          <div className="text-right">
            <span className="font-black text-blue-600 text-sm">₹{convertedInr.toLocaleString('en-IN')}</span>
            <div className="text-[9px] text-slate-400">1 {selectedCurrency} = ₹{fxRates[selectedCurrency].rate}</div>
          </div>
        </div>
      </div>

      {/* SECTION 4: ECO LOGISTICS / GREEN EMISSIONS */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
          <div className="p-1 bg-emerald-600 text-white rounded-lg">
            <Leaf className="w-3.5 h-3.5" />
          </div>
          <span>Green Carbon Offset</span>
        </div>
        <p className="text-[11px] text-emerald-800 leading-snug">
          Maritime ocean freight reduces CO₂ emissions by up to <strong className="font-black text-emerald-950">84%</strong> compared to standard air cargo routes.
        </p>
      </div>

      {/* SECTION 5: 24/7 FREIGHT BROKER HOTLINE */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-4 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-xl">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-black text-white">Freight Broker Desk</div>
              <div className="text-[9px] text-blue-100">Live Rate Negotiation & Charters</div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
        </div>

        <button
          onClick={handleCopyHotline}
          className="w-full bg-white hover:bg-blue-50 text-blue-900 font-black py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
        >
          {isCopied ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copied +91 22 8800 4492</span>
            </>
          ) : (
            <>
              <span>Direct Hotline: +91 22 8800 4492</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
