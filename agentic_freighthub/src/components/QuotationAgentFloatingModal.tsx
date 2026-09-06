import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  CheckCircle2,
  Ship,
  Plane,
  Truck,
  Layers,
  Fuel,
  ShieldCheck,
  Percent,
  Clock,
  ArrowRight,
  BookmarkPlus,
  FileCheck,
  X,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MapPin,
  Anchor,
  Radio,
  Cpu,
  Check
} from 'lucide-react';
import { TariffBreakdown, QuoteFormState } from '../types';
import { formatCurrency } from '../utils/calculator';
import { PORTS_AND_HUBS } from '../data/freightData';

interface QuotationAgentFloatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: TariffBreakdown;
  formData: QuoteFormState;
  onConfirmQuote: () => void;
  onSaveDraft: () => void;
  onCalculationFinished?: () => void;
}

interface AgentStage {
  id: string;
  name: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  startMs: number;
  endMs: number;
  subLogs: string[];
}

const AGENT_STAGES: AgentStage[] = [
  {
    id: 'validate_agent',
    name: '1. Pre-Flight Validation Agent',
    role: 'Origin, destination, payload, HS code & Incoterm audit',
    icon: ShieldCheck,
    startMs: 0,
    endMs: 1400,
    subLogs: [
      'Validating UN/LOCODE port pairs and active trade lanes...',
      'Verifying container payload distribution & cargo specifications...',
      'Auditing HS Code tariff heading and Incoterms 2020 commercial obligations...'
    ]
  },
  {
    id: 'route_agent',
    name: '2. Route Intelligence Agent',
    role: 'Nautical miles, AIS sea lanes & carrier space',
    icon: Anchor,
    startMs: 1400,
    endMs: 2800,
    subLogs: [
      'Mapping geodetic sea lanes & canal transit passages...',
      'Querying liner schedules (Maersk, MSC, CMA CGM, Hapag-Lloyd)...',
      'Calculating distance and baseline transit window...'
    ]
  },
  {
    id: 'pricing_agent',
    name: '3. Pricing Engine (Rule + ML)',
    role: 'Deterministic cost matrix + XGBoost spot regression',
    icon: Percent,
    startMs: 2800,
    endMs: 4200,
    subLogs: [
      'Executing rule-based Base Freight, BAF & THC cost ledger...',
      'Feeding market features into ML Spot Model (R² 0.974)...',
      'Applying predictive volatility adjustment & fuel hedge multiplier...'
    ]
  },
  {
    id: 'weather_agent',
    name: '4. Weather Agent Radar',
    role: 'Ocean state, wave swells & storm risk buffer',
    icon: Zap,
    startMs: 4200,
    endMs: 5500,
    subLogs: [
      'Connecting to NOAA GFS Marine Grid & IMD Radar...',
      'Sampling significant wave heights and Beaufort wind vectors...',
      'Computing storm delay probability (+4h buffer window)...'
    ]
  },
  {
    id: 'customs_agent',
    name: '5. Customs Agent Desk',
    role: 'Tariff classification, statutory duties & ICEGATE filing',
    icon: FileCheck,
    startMs: 5500,
    endMs: 6800,
    subLogs: [
      'Querying CBIC ICEGATE tariff schedule & DGFT restricted lists...',
      'Computing Basic Customs Duty (BCD), IGST & Social Welfare Surcharge...',
      'Validating mandatory export document checklist (Invoice, CoO, BL)...'
    ]
  },
  {
    id: 'risk_agent',
    name: '6. Risk Engine & Officer Desk',
    role: '5-pillar composite risk & officer sign-off evaluation',
    icon: Cpu,
    startMs: 6800,
    endMs: 8000,
    subLogs: [
      'Synthesizing Weather, Port, Cargo, Customs & Passage risks...',
      'Calculating Composite Risk Score and classification tier...',
      'Evaluating Customer Officer sign-off mandate & issuing locked quote...'
    ]
  }
];

export const QuotationAgentFloatingModal: React.FC<QuotationAgentFloatingModalProps> = ({
  isOpen,
  onClose,
  breakdown,
  formData,
  onConfirmQuote,
  onSaveDraft,
  onCalculationFinished,
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [activeLog, setActiveLog] = useState<string>('Initializing multi-agent calculation swarm...');
  const [showItemizedCost, setShowItemizedCost] = useState<boolean>(true);
  const [draftSavedToast, setDraftSavedToast] = useState<boolean>(false);

  const TOTAL_DURATION_MS = 8000; // Approx 8 seconds calculation
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setElapsedMs(0);
      setIsFinished(false);
      setDraftSavedToast(false);
      setActiveLog('Initializing multi-agent calculation swarm...');

      const tickInterval = 50;
      let currentMs = 0;

      intervalRef.current = setInterval(() => {
        currentMs += tickInterval;
        setElapsedMs(currentMs);

        // Find active agent
        const activeStage = AGENT_STAGES.find((st) => currentMs >= st.startMs && currentMs < st.endMs);
        if (activeStage) {
          const subIndex = Math.min(
            activeStage.subLogs.length - 1,
            Math.floor(((currentMs - activeStage.startMs) / (activeStage.endMs - activeStage.startMs)) * activeStage.subLogs.length)
          );
          setActiveLog(activeStage.subLogs[subIndex]);
        }

        if (currentMs >= TOTAL_DURATION_MS) {
          clearInterval(intervalRef.current);
          setIsFinished(true);
          setActiveLog('Quotation generated successfully. Rates locked.');
          if (onCalculationFinished) {
            onCalculationFinished();
          }
        }
      }, tickInterval);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round((elapsedMs / TOTAL_DURATION_MS) * 100));
  const secondsRemaining = Math.max(0, Math.ceil((TOTAL_DURATION_MS - elapsedMs) / 1000));

  const originHub = PORTS_AND_HUBS.find((p) => p.code === formData.originPortCode) || {
    city: formData.originPortCode || 'Origin Port',
    country: '',
    name: formData.originPortCode || 'Origin'
  };
  const destHub = PORTS_AND_HUBS.find((p) => p.code === formData.destinationPortCode) || {
    city: formData.destinationPortCode || 'Destination Port',
    country: '',
    name: formData.destinationPortCode || 'Destination'
  };

  const handleInternalSaveDraft = () => {
    onSaveDraft();
    setDraftSavedToast(true);
    setTimeout(() => {
      setDraftSavedToast(false);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B1222] border border-cyan-500/30 rounded-2xl sm:rounded-3xl w-full max-w-xl shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[90vh] text-white relative">
        {/* Glow corner effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header - Compact */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-5 bg-gradient-to-r from-[#0F1A30] via-[#111F3C] to-[#0F1A30] border-b border-slate-800 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border transition-all duration-300 ${
              isFinished
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-md shadow-emerald-500/20'
                : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-md shadow-cyan-500/20 animate-pulse'
            }`}>
              {isFinished ? <CheckCircle2 className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {isFinished ? 'ESTIMATE READY' : 'SWARM CALIBRATION'}
                </span>
                {!isFinished && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {secondsRemaining}s remaining
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight mt-0.5">
                {isFinished ? 'Official Freight Quotation' : 'Calculating Freight Tariff & Routes'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-3.5 relative z-10">
          {/* SECTION 1: CALCULATION FILLUP AGENT LEVEL SYSTEM (During 8s) */}
          {!isFinished ? (
            <div className="space-y-3 animate-in fade-in duration-300">
              {/* Central Progress Fillup Indicator - Compact */}
              <div className="bg-[#070D1A] border border-cyan-500/30 rounded-xl p-3 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200">Calibration Progress</span>
                  </div>
                  <span className="text-xs font-black font-mono text-cyan-400">{progressPercent}%</span>
                </div>

                {/* Main Progress Bar Fillup */}
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-100 ease-out shadow-md shadow-cyan-400/50"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Real-time Sublog Terminal */}
                <div className="mt-2.5 bg-slate-950/90 border border-slate-800/80 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-cyan-300 flex items-center gap-2 shadow-inner">
                  <RefreshCw className="w-3 h-3 animate-spin text-cyan-400 shrink-0" />
                  <span className="truncate">{activeLog}</span>
                </div>
              </div>

              {/* 5-Agent Visual Fillup Level Nodes - Compact */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between px-1">
                  <span>AGENT DISPATCH & STAGES</span>
                  <span className="text-[9px] text-cyan-400">5 ACTIVE NODES</span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {AGENT_STAGES.map((agent) => {
                    const Icon = agent.icon;
                    const isCompleted = elapsedMs >= agent.endMs;
                    const isActive = elapsedMs >= agent.startMs && elapsedMs < agent.endMs;

                    const agentPercent = isCompleted
                      ? 100
                      : isActive
                      ? Math.min(100, Math.round(((elapsedMs - agent.startMs) / (agent.endMs - agent.startMs)) * 100))
                      : 0;

                    return (
                      <div
                        key={agent.id}
                        className={`px-3 py-2 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                          isCompleted
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                            : isActive
                            ? 'bg-cyan-950/40 border-cyan-400/60 shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-400/30'
                            : 'bg-slate-900/40 border-slate-800/70 text-slate-500 opacity-60'
                        }`}
                      >
                        {/* Background fill-up level animation */}
                        {isActive && (
                          <div
                            className="absolute inset-y-0 left-0 bg-cyan-500/10 transition-all duration-75 ease-linear pointer-events-none"
                            style={{ width: `${agentPercent}%` }}
                          />
                        )}

                        <div className="flex items-center justify-between relative z-10 gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`p-1.5 rounded-lg border shrink-0 transition-colors ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                  : isActive
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse'
                                  : 'bg-slate-800 text-slate-500 border-slate-700'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-white truncate">{agent.name}</span>
                                {isActive && (
                                  <span className="text-[8px] font-extrabold px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30 animate-pulse">
                                    {agentPercent}%
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">{agent.role}</p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isCompleted ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                                <Check className="w-3 h-3" />
                              </div>
                            ) : isActive ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-700 block" />
                            )}
                          </div>
                        </div>

                        {/* Mini progress line */}
                        <div className="w-full bg-slate-800/80 rounded-full h-1 mt-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-75 ${
                              isCompleted
                                ? 'bg-emerald-400 w-full'
                                : isActive
                                ? 'bg-cyan-400'
                                : 'bg-transparent w-0'
                            }`}
                            style={{ width: `${agentPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* SECTION 2: FINAL GENERATED QUOTE DISPLAY (Revealed after 8s) */
            <div className="space-y-3.5 animate-in fade-in zoom-in-95 duration-300">
              {/* Success Badge */}
              <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-emerald-950/80 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 font-black" />
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                      RATE GUARANTEED & READY
                    </div>
                    <div className="text-xs font-bold text-white">
                      Tariff locked for 14 calendar days
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {breakdown.chargeBasis}
                </span>
              </div>

              {/* Primary Cost Card & Key Route Specs */}
              <div className="bg-[#080E1D] border border-slate-800 rounded-2xl p-4 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      TOTAL ALL-INCLUSIVE FREIGHT TARIFF
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight mt-0.5 flex items-baseline gap-1.5">
                      <span>{formatCurrency(breakdown.grandTotal, breakdown.currency)}</span>
                      <span className="text-[11px] text-slate-400 font-semibold uppercase">({breakdown.currency})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-2 rounded-xl self-start sm:self-auto">
                    <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
                      {formData.transportMode === 'air' ? <Plane className="w-3.5 h-3.5" /> : <Ship className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-xs">
                      <div className="font-extrabold text-white uppercase text-[11px]">{formData.transportMode} {formData.oceanLoadType || ''}</div>
                      <div className="text-slate-400 text-[9px]">{breakdown.cargoCountSummary || '1 Item'} • {breakdown.totalWeightKg} kg</div>
                    </div>
                  </div>
                </div>

                {/* Corridor & Estimated Transit Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-[#0D1629] p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                      <MapPin className="w-3 h-3 text-blue-400" />
                      <span>Origin Corridor</span>
                    </div>
                    <div className="font-bold text-white text-xs truncate">{originHub.city} ({formData.originPortCode || 'BOM'})</div>
                    <div className="text-[9px] text-slate-400">{formData.cargoReadyDate || 'Ready on Dispatch'}</div>
                  </div>

                  <div className="bg-[#0D1629] p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>Destination Port</span>
                    </div>
                    <div className="font-bold text-white text-xs truncate">{destHub.city} ({formData.destinationPortCode || 'AEJEA'})</div>
                    <div className="text-[9px] text-emerald-400 font-bold">Est. Arrival: {breakdown.estimatedArrivalDate}</div>
                  </div>

                  <div className="bg-[#0D1629] p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Transit & Distance</span>
                    </div>
                    <div className="font-bold text-white text-xs">{breakdown.estimatedTransitDays}</div>
                    <div className="text-[9px] text-slate-400">{breakdown.estimatedDistanceNmOrKm}</div>
                  </div>
                </div>

                {/* Itemized Cost Breakdown Toggle & Table */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowItemizedCost(!showItemizedCost)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-cyan-400 hover:text-cyan-300 py-0.5 cursor-pointer"
                  >
                    <span>Quote Calculation Formula Ledger</span>
                    {showItemizedCost ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showItemizedCost && (
                    <div className="mt-2 space-y-1.5 border border-slate-800 bg-[#060A14] rounded-xl p-3 text-[11px] font-mono">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Base Freight ({breakdown.equipmentSummary || '40HC × 2'})</span>
                        <span className="font-semibold text-white">{formatCurrency(breakdown.baseTariff, breakdown.currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">BAF ({breakdown.bafPercentage || 10}%)</span>
                        <span className="font-semibold">{formatCurrency(breakdown.bafFuelSurcharge, breakdown.currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Origin THC</span>
                        <span className="font-semibold">{formatCurrency(breakdown.terminalHandlingCharge, breakdown.currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Documentation</span>
                        <span className="font-semibold">{formatCurrency(breakdown.documentationFee, breakdown.currency)}</span>
                      </div>
                      <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-slate-200">
                        <span>Total Cost</span>
                        <span className="text-cyan-300">{formatCurrency(breakdown.totalCost || breakdown.subtotal, breakdown.currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Margin ({breakdown.marginPercentage || 15}%)</span>
                        <span>{formatCurrency(breakdown.marginAmount || Math.round((breakdown.totalCost || breakdown.subtotal) * 0.15), breakdown.currency)}</span>
                      </div>
                      <div className="border-t border-cyan-500/40 pt-1.5 flex justify-between font-bold text-emerald-400">
                        <span>SELL PRICE</span>
                        <span className="text-emerald-400 font-black">{formatCurrency(breakdown.finalSellPrice || breakdown.grandTotal, breakdown.currency)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Toast for Save As Draft inside modal */}
              {draftSavedToast && (
                <div className="bg-blue-950/90 border border-blue-500/40 rounded-xl p-2.5 text-[11px] text-blue-200 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Quotation inputs & calculated estimate successfully saved to <strong>Saved Drafts</strong>!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer / Actions - Compact */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-5 bg-gradient-to-r from-[#0F1A30] via-[#111F3C] to-[#0F1A30] border-t border-slate-800 relative z-10 shrink-0">
          {!isFinished ? (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                <span>Synchronizing rate nodes...</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* ON THE LAST: 2 MANDATORY BUTTONS -> 1. CONFIRM QUOTE & 2. SAVE AS DRAFT */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto text-[11px] text-slate-400 hover:text-white py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ← Adjust Inputs
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* BUTTON 2: SAVE AS DRAFT */}
                <button
                  type="button"
                  onClick={handleInternalSaveDraft}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border border-slate-700 shadow-sm cursor-pointer active:scale-95"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-blue-400" />
                  <span>SAVE AS DRAFT</span>
                </button>

                {/* BUTTON 1: CONFIRM QUOTE */}
                <button
                  type="button"
                  onClick={() => {
                    onConfirmQuote();
                    onClose();
                  }}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-500 active:from-emerald-700 text-white font-black rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>CONFIRM QUOTE</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
