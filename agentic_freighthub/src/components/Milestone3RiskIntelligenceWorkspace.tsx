import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CloudRain,
  Compass,
  FileCheck2,
  Cpu,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Sliders,
  Eye,
  Upload,
  RefreshCw,
  Zap,
  Info,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
  Filter,
  FileText,
  Anchor,
  Ship,
  Wind,
  Waves,
  Thermometer,
  Gauge,
  Check,
  Building,
  UserCheck,
  Scale
} from 'lucide-react';
import {
  WeatherAssessment,
  WeatherObservation,
  WeatherAlert,
  CustomsComplianceCheck,
  CustomsChecklistItem,
  RegulationChunk,
  HSCodeReference,
  ShipmentRiskAssessment,
  RiskFactor,
  MLModelEvaluationMetrics,
  RuleVsMLComparison,
  QuoteDecision,
  RiskLevel
} from '../types/milestone3';
import {
  SEEDED_HS_CODES,
  SEEDED_REGULATION_DOCS,
  SEEDED_REGULATION_CHUNKS,
  SEEDED_CUSTOMS_CHECKS,
  SEEDED_WEATHER_ASSESSMENTS,
  SEEDED_RISK_ASSESSMENTS,
  ML_MODEL_METRICS,
  SEEDED_DATA_FRESHNESS
} from '../data/milestone3Data';
import { assessWeatherForRoute } from '../backend/weather/weatherService';
import { validateCustomsCompliance, searchRegulationsRAG, signOffCustomsCheck, uploadShipmentDocument } from '../backend/customs/customsService';
import { assessShipmentCompositeRisk } from '../backend/risk/riskEngine';
import { predictMLPrice, compareRuleVsMLPricing } from '../backend/pricing/mlPricingService';
import { CustomsDashboardWorkspace } from './CustomsDashboardWorkspace';
import { RegulationsLibraryWorkspace } from './RegulationsLibraryWorkspace';
import { RiskWeatherDashboardWorkspace } from './RiskWeatherDashboardWorkspace';
import { MLPricingComparisonPanel } from './MLPricingComparisonPanel';

export type Milestone3Tab =
  | 'weather'
  | 'customs'
  | 'customs-officer'
  | 'risk-engine'
  | 'ml-pricing'
  | 'customs-workspace'
  | 'regulations-library'
  | 'risk-weather-analytics'
  | 'ml-benchmark-panel';

interface Milestone3Props {
  initialTab?: Milestone3Tab;
  userRole?: string;
  userEmail?: string;
  onOpenQuoteBuilder?: () => void;
}

export const Milestone3RiskIntelligenceWorkspace: React.FC<Milestone3Props> = ({
  initialTab = 'risk-engine',
  userRole = 'customer',
  userEmail = 'customs.officer@freighthub.in',
  onOpenQuoteBuilder,
}) => {
  const [activeTab, setActiveTab] = useState<Milestone3Tab>(initialTab);

  const isOfficerRole = userRole === 'customs-officer' || userRole === 'admin' || userRole === 'freight-agent';

  // Fallback active tab if regular user is on an officer-only tab
  useEffect(() => {
    if (!isOfficerRole && (activeTab === 'customs-officer' || activeTab === 'customs-workspace')) {
      setActiveTab('risk-engine');
    }
  }, [isOfficerRole, activeTab]);

  // Weather State
  const [weatherOrigin, setWeatherOrigin] = useState<string>('MAA');
  const [weatherDest, setWeatherDest] = useState<string>('SGSIN');
  const [weatherData, setWeatherData] = useState<WeatherAssessment>(SEEDED_WEATHER_ASSESSMENTS['MAA-SGSIN']);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);

  // Customs State
  const [customsOrigin, setCustomsOrigin] = useState<string>('IN');
  const [customsDest, setCustomsDest] = useState<string>('SG');
  const [selectedHsCode, setSelectedHsCode] = useState<string>('8471.30.10');
  const [commodityText, setCommodityText] = useState<string>('High-Performance Computing Laptops');
  const [incotermVal, setIncotermVal] = useState<string>('FOB');
  const [customsCheck, setCustomsCheck] = useState<CustomsComplianceCheck>(SEEDED_CUSTOMS_CHECKS[0]);
  const [ragQuery, setRagQuery] = useState<string>('Commercial Invoice HS 8471 advance filing');
  const [ragResults, setRagResults] = useState<RegulationChunk[]>(SEEDED_REGULATION_CHUNKS);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);

  // Customs Officer Workspace State
  const [complianceCases, setComplianceCases] = useState<CustomsComplianceCheck[]>(SEEDED_CUSTOMS_CHECKS);
  const [selectedCase, setSelectedCase] = useState<CustomsComplianceCheck>(SEEDED_CUSTOMS_CHECKS[1]); // CHK-2026-002 Needs Review
  const [caseFilterStatus, setCaseFilterStatus] = useState<string>('ALL');
  const [officerNotes, setOfficerNotes] = useState<string>('');
  const [officerActionToast, setOfficerActionToast] = useState<string | null>(null);

  // Risk Engine State
  const [riskAssessment, setRiskAssessment] = useState<ShipmentRiskAssessment>(SEEDED_RISK_ASSESSMENTS['SHP-1002']);
  const [simWeatherScore, setSimWeatherScore] = useState<number>(24);
  const [simCustomsScore, setSimCustomsScore] = useState<number>(18);
  const [simRouteScore, setSimRouteScore] = useState<number>(22);
  const [simPortScore, setSimPortScore] = useState<number>(20);
  const [simCargoScore, setSimCargoScore] = useState<number>(15);

  // ML Pricing State
  const [mlDistance, setMlDistance] = useState<number>(1850);
  const [mlWeight, setMlWeight] = useState<number>(3800);
  const [mlMode, setMlMode] = useState<string>('ocean');
  const [mlContainerSpec, setMlContainerSpec] = useState<string>('20GP');
  const [mlHazmat, setMlHazmat] = useState<boolean>(false);
  const [mlReefer, setMlReefer] = useState<boolean>(false);
  const [mlRulePrice, setMlRulePrice] = useState<number>(118500);
  const [mlComparison, setMlComparison] = useState<RuleVsMLComparison | null>(null);

  // Synchronize Tab from prop
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Handle Weather Assess
  const handleAssessWeather = (orig: string = weatherOrigin, dst: string = weatherDest) => {
    setIsWeatherLoading(true);
    setTimeout(() => {
      const res = assessWeatherForRoute({
        originPort: orig,
        destPort: dst,
        transportMode: 'ocean',
      });
      setWeatherData(res);
      setSimWeatherScore(res.risk_score);
      setIsWeatherLoading(false);
    }, 300);
  };

  // Handle Customs Validate
  const handleValidateCustoms = () => {
    const res = validateCustomsCompliance({
      originCountry: customsOrigin,
      destCountry: customsDest,
      originPort: weatherOrigin,
      destPort: weatherDest,
      hsCode: selectedHsCode,
      commodity: commodityText,
      incoterm: incotermVal,
      isHazmat: selectedHsCode.startsWith('29'),
    });
    setCustomsCheck(res);
    setSimCustomsScore(100 - res.readiness_score);
    // Add to compliance cases
    setComplianceCases(prev => [res, ...(prev || []).filter(c => c && c.id !== res.id)]);
  };

  // Handle RAG Search
  const handleRagSearch = (queryStr: string) => {
    setRagQuery(queryStr);
    const results = searchRegulationsRAG(queryStr);
    setRagResults(results || []);
  };

  // Handle Document Upload Simulation
  const handleSimulateDocUpload = (checklistItemId: string, docName: string) => {
    const resDoc = uploadShipmentDocument({
      shipment_id: customsCheck.shipment_id,
      customs_check_id: customsCheck.id,
      file_name: docName,
      document_type: docName.includes('MSDS') ? 'MSDS_HAZMAT' : 'COMMERCIAL_INVOICE',
      file_size_kb: 540,
    });

    setCustomsCheck(prev => {
      const updatedItems = (prev.checklist_items || []).map(item =>
        item.id === checklistItemId
          ? {
              ...item,
              status: 'VERIFIED' as const,
              document_uploaded: true,
              uploaded_file_name: docName,
            }
          : item
      );
      const verified = (updatedItems || []).filter(i => i && i.status === 'VERIFIED').length;
      const readiness = Math.round((verified / Math.max(1, prev.mandatory_documents_count)) * 100);
      return {
        ...prev,
        checklist_items: updatedItems,
        uploaded_documents_count: (updatedItems || []).filter(i => i && i.document_uploaded).length,
        verified_documents_count: verified,
        readiness_score: readiness,
        status: readiness >= 100 ? ('PASS' as const) : ('NEEDS_REVIEW' as const),
      };
    });

    setUploadSuccessToast(`Uploaded & ICEGATE verified: ${docName}`);
    setTimeout(() => setUploadSuccessToast(null), 3000);
  };

  // Handle Customs Officer Sign-off Action
  const handleOfficerSignOff = (action: 'APPROVE' | 'REQUEST_DOCUMENTS' | 'CONDITIONAL' | 'REJECT') => {
    const updated = signOffCustomsCheck(
      selectedCase.id,
      action,
      userEmail || 'customer.officer@freighthub.in',
      officerNotes || `Officer sign-off completed with action ${action}`
    );

    if (updated) {
      setSelectedCase(updated);
      setComplianceCases(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      setOfficerActionToast(`Compliance case ${selectedCase.id} successfully updated: ${action}`);
      setTimeout(() => setOfficerActionToast(null), 4000);

      // Recalculate Composite Risk
      const updatedRisk = assessShipmentCompositeRisk({
        shipmentId: selectedCase.shipment_id,
        quoteId: selectedCase.quote_id,
        weatherScore: simWeatherScore,
        customsScore: 100 - updated.readiness_score,
        routeScore: simRouteScore,
        portScore: simPortScore,
        cargoScore: simCargoScore,
        customsStatus: updated.status,
        customsSignoffCompleted: action === 'APPROVE',
      });
      setRiskAssessment(updatedRisk);
    }
  };

  // Recalculate Composite Risk on Slider Change
  useEffect(() => {
    const res = assessShipmentCompositeRisk({
      shipmentId: customsCheck.shipment_id || 'SHP-1002',
      quoteId: customsCheck.quote_id || 'Q-9842',
      weatherScore: simWeatherScore,
      customsScore: simCustomsScore,
      routeScore: simRouteScore,
      portScore: simPortScore,
      cargoScore: simCargoScore,
      customsStatus: customsCheck.status,
      customsSignoffCompleted: customsCheck.status === 'APPROVED' || customsCheck.status === 'PASS',
    });
    setRiskAssessment(res);
  }, [simWeatherScore, simCustomsScore, simRouteScore, simPortScore, simCargoScore]);

  // Run ML Pricing Comparison
  useEffect(() => {
    const comp = compareRuleVsMLPricing(
      'Q-9842',
      mlRulePrice,
      {
        baseTariff: Math.round(mlRulePrice * 0.7),
        bafFuel: Math.round(mlRulePrice * 0.12),
        thc: 12000,
        docFee: 2500,
        margin: Math.round(mlRulePrice * 0.1),
      },
      {
        distanceNm: mlDistance,
        weightKg: mlWeight,
        transportMode: mlMode,
        containerSpec: mlContainerSpec,
        isHazmat: mlHazmat,
        isReefer: mlReefer,
      }
    );
    setMlComparison(comp);
  }, [mlDistance, mlWeight, mlMode, mlContainerSpec, mlHazmat, mlReefer, mlRulePrice]);

  return (
    <div id="risk-intelligence-workspace" className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Workspace Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-36 bottom-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Risk & Compliance Intelligence
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[11px] font-bold">
                Live State Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Weather, Compliance & Risk Intelligence Suite
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              End-to-end integration of marine weather radar, RAG-powered customs regulation retrieval, 5-factor composite shipment risk scoring, and ML freight pricing models.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onOpenQuoteBuilder && (
              <button
                id="btn-open-quote-builder"
                onClick={onOpenQuoteBuilder}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Go to Quote Builder</span>
              </button>
            )}
          </div>
        </div>

        {/* 5-Tab Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <button
            id="tab-risk-engine"
            onClick={() => setActiveTab('risk-engine')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'risk-engine'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span>Composite Risk Engine</span>
            <span className="px-1.5 py-0.5 bg-blue-900/60 rounded text-[10px]">30/25/20/15/10</span>
          </button>

          <button
            id="tab-weather"
            onClick={() => setActiveTab('weather')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'weather'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CloudRain className="w-4 h-4 text-cyan-400" />
            <span>Weather Intelligence</span>
          </button>

          <button
            id="tab-customs"
            onClick={() => setActiveTab('customs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'customs'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Customs & RAG Regulations</span>
          </button>

          {isOfficerRole && (
            <button
              id="tab-customs-officer"
              onClick={() => setActiveTab('customs-officer')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'customs-officer'
                  ? 'bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 font-black'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-800/50 hover:bg-amber-900/40'
              }`}
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Customer Officer Workspace</span>
              <span className="px-1.5 py-0.5 bg-amber-400/20 text-amber-300 rounded-full text-[10px]">
                {(complianceCases || []).filter(c => c && (c.status === 'NEEDS_REVIEW' || c.status === 'NEEDS_DOCUMENTS')).length} Pending
              </span>
            </button>
          )}

          <button
            id="tab-ml-pricing"
            onClick={() => setActiveTab('ml-pricing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ml-pricing'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>ML Pricing & Models</span>
          </button>

          {/* Phase 5 Additive Workspaces */}
          {isOfficerRole && (
            <button
              id="tab-customs-workspace"
              onClick={() => setActiveTab('customs-workspace')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'customs-workspace'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-indigo-400" />
              <span>Customs Workspace (/customs/dashboard)</span>
            </button>
          )}

          <button
            id="tab-regulations-library"
            onClick={() => setActiveTab('regulations-library')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'regulations-library'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Regulation Library (/customs/regulations)</span>
          </button>

          <button
            id="tab-risk-weather-analytics"
            onClick={() => setActiveTab('risk-weather-analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'risk-weather-analytics'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Risk & Weather (/analytics/risk)</span>
          </button>

          <button
            id="tab-ml-benchmark-panel"
            onClick={() => setActiveTab('ml-benchmark-panel')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ml-benchmark-panel'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>ML vs. Rule Benchmark Panel</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COMPOSITE SHIPMENT RISK ENGINE & EXPLAINABILITY MATRIX              */}
      {/* ========================================================================= */}
      {activeTab === 'risk-engine' && (
        <div id="m3-tab-content-risk" className="space-y-6">
          {/* Top Row: Overall Score Meter & Quote Decision Gating */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Overall Composite Score Gauge (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">Composite Risk Score</h3>
                      <p className="text-xs text-slate-500">5-Factor Weighted Mathematical Model</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      riskAssessment.risk_level === 'LOW'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : riskAssessment.risk_level === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : riskAssessment.risk_level === 'HIGH'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                    }`}
                  >
                    {riskAssessment.risk_level} RISK
                  </span>
                </div>

                {/* Score Number Display */}
                <div className="flex items-baseline gap-3 my-4">
                  <span className="text-5xl font-black text-slate-900 tracking-tight">
                    {riskAssessment.overall_score}
                  </span>
                  <span className="text-sm font-bold text-slate-400">/ 100 Max Risk Index</span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200 mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      riskAssessment.overall_score <= 30
                        ? 'bg-emerald-500'
                        : riskAssessment.overall_score <= 60
                        ? 'bg-amber-500'
                        : riskAssessment.overall_score <= 80
                        ? 'bg-orange-500'
                        : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, riskAssessment.overall_score))}%` }}
                  />
                </div>

                {/* Threshold Reference Scale */}
                <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-bold mb-4">
                  <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded-lg border border-emerald-100">
                    0-30 LOW
                  </div>
                  <div className="bg-amber-50 text-amber-700 p-1.5 rounded-lg border border-amber-100">
                    31-60 MEDIUM
                  </div>
                  <div className="bg-orange-50 text-orange-700 p-1.5 rounded-lg border border-orange-100">
                    61-80 HIGH
                  </div>
                  <div className="bg-red-50 text-red-700 p-1.5 rounded-lg border border-red-100">
                    81-100 CRITICAL
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800">Formula Weights: </span>
                  Weather (30%) + Customs (25%) + Route (20%) + Port (15%) + Cargo (10%)
                </div>
              </div>

              {/* Interactive Simulation Sliders */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Interactive Risk Simulation</span>
                  <button
                    onClick={() => {
                      setSimWeatherScore(24);
                      setSimCustomsScore(18);
                      setSimRouteScore(22);
                      setSimPortScore(20);
                      setSimCargoScore(15);
                    }}
                    className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-semibold mb-0.5">
                      <span>Weather Score (30%)</span>
                      <span className="font-mono font-bold text-slate-800">{simWeatherScore}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={simWeatherScore}
                      onChange={e => setSimWeatherScore(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-semibold mb-0.5">
                      <span>Customs Score (25%)</span>
                      <span className="font-mono font-bold text-slate-800">{simCustomsScore}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={simCustomsScore}
                      onChange={e => setSimCustomsScore(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-semibold mb-0.5">
                      <span>Cargo Risk (10%)</span>
                      <span className="font-mono font-bold text-slate-800">{simCargoScore}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={simCargoScore}
                      onChange={e => setSimCargoScore(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Quote Decision Gatekeeper & Alerts (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">Quote Issuance State Machine</h3>
                      <p className="text-xs text-slate-500">Automated Risk & Compliance Gatekeeper</p>
                    </div>
                  </div>

                  {/* Decision Badge */}
                  <div
                    className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow-sm ${
                      riskAssessment.quote_decision === 'APPROVED'
                        ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                        : riskAssessment.quote_decision === 'NEEDS_REVIEW'
                        ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                        : 'bg-red-600 text-white shadow-red-500/20'
                    }`}
                  >
                    {riskAssessment.quote_decision === 'APPROVED' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : riskAssessment.quote_decision === 'NEEDS_REVIEW' ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>DECISION: {riskAssessment.quote_decision.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* State Machine Flow Diagram */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl mb-4 text-xs font-mono">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                    Quote State Transition Pipeline:
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300">
                      1. Route Validated
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300">
                      2. Weather Assessed
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300">
                      3. Customs Checked
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span
                      className={`px-2 py-1 rounded font-bold ${
                        riskAssessment.quote_decision === 'APPROVED'
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400'
                          : riskAssessment.quote_decision === 'NEEDS_REVIEW'
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-400'
                          : 'bg-red-500/30 text-red-300 border border-red-400'
                      }`}
                    >
                      4. {riskAssessment.quote_decision}
                    </span>
                  </div>
                </div>

                {/* Decision Rationale Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-4">
                  <div className="font-bold text-xs text-slate-800 mb-1 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Executive Decision Rationale:</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {riskAssessment.decision_rationale}
                  </p>
                </div>

                {/* Active Alerts */}
                <div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Active System Risk Alerts ({(riskAssessment?.alerts || []).length})
                  </div>
                  {(riskAssessment?.alerts || []).length === 0 ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Zero blocking risk alerts. Route, weather, and compliance thresholds cleared.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(riskAssessment?.alerts || []).map(alert => (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-red-50 border-red-200 text-red-900'
                              : 'bg-amber-50 border-amber-200 text-amber-900'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                          <div>
                            <div className="font-bold">{alert.title}</div>
                            <div className="text-[11px] mt-0.5 text-slate-600">{alert.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Model Engine: {riskAssessment.model_version}</span>
                <span>Confidence: {(riskAssessment.confidence_score * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Explainability Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Risk Factor Explainability Matrix</h3>
                <p className="text-xs text-slate-500">Transparent factor-by-factor breakdown, weights, and audited sources</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold font-mono">
                5 Dimensions Audited
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3 px-2">Dimension</th>
                    <th className="pb-3 px-2">Factor Name</th>
                    <th className="pb-3 px-2 text-center">Raw Score</th>
                    <th className="pb-3 px-2 text-center">Weight</th>
                    <th className="pb-3 px-2 text-center">Contribution</th>
                    <th className="pb-3 px-2">Severity</th>
                    <th className="pb-3 px-2">Reason & Audit Context</th>
                    <th className="pb-3 px-2">Data Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(riskAssessment?.factors || []).map(factor => (
                    <tr key={factor.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-2 font-bold text-slate-900">{factor.factor_type}</td>
                      <td className="py-3 px-2 text-slate-800">{factor.factor_name}</td>
                      <td className="py-3 px-2 text-center font-mono font-bold">{factor.score}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-500">{(factor.weight * 100).toFixed(0)}%</td>
                      <td className="py-3 px-2 text-center font-mono font-bold text-blue-600">
                        {factor.contribution.toFixed(1)}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            factor.severity === 'LOW'
                              ? 'bg-emerald-50 text-emerald-700'
                              : factor.severity === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700'
                              : factor.severity === 'HIGH'
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {factor.severity}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-600 max-w-xs">{factor.reason}</td>
                      <td className="py-3 px-2 font-mono text-[10px] text-slate-500">{factor.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WEATHER INTELLIGENCE & ROUTE RADAR                                  */}
      {/* ========================================================================= */}
      {activeTab === 'weather' && (
        <div id="m3-tab-content-weather" className="space-y-6">
          {/* Corridor Selection Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Marine Weather Corridor Sampler</h3>
                <p className="text-xs text-slate-500">NOAA WaveWatch III & Copernicus Oceanic Radar Integration</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setWeatherOrigin('MAA');
                    setWeatherDest('SGSIN');
                    handleAssessWeather('MAA', 'SGSIN');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    weatherOrigin === 'MAA' && weatherDest === 'SGSIN'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Bay of Bengal (MAA → SGSIN)
                </button>

                <button
                  onClick={() => {
                    setWeatherOrigin('BOM');
                    setWeatherDest('AEJEA');
                    handleAssessWeather('BOM', 'AEJEA');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    weatherOrigin === 'BOM' && weatherDest === 'AEJEA'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Arabian Sea Squall (BOM → AEJEA)
                </button>
              </div>
            </div>

            {/* Weather Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Gauge className="w-4 h-4 text-blue-600" />
                  <span>Weather Risk</span>
                </div>
                <div className="text-xl font-black text-slate-900">{weatherData.risk_score}/100</div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">{weatherData.risk_level} Risk Level</div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Delay Probability</span>
                </div>
                <div className="text-xl font-black text-amber-600">{(weatherData.delay_probability * 100).toFixed(0)}%</div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">+{weatherData.expected_delay_hours} hrs expected</div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Waves className="w-4 h-4 text-cyan-600" />
                  <span>Wave Risk</span>
                </div>
                <div className="text-xl font-black text-slate-900">{weatherData.wave_risk}/100</div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                  Peak: {(weatherData?.sampled_observations || []).length > 0 ? Math.max(...(weatherData.sampled_observations || []).map(o => o.wave_height)) : 0}m swell
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Wind className="w-4 h-4 text-indigo-600" />
                  <span>Wind Risk</span>
                </div>
                <div className="text-xl font-black text-slate-900">{weatherData.wind_risk}/100</div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                  Max: {(weatherData?.sampled_observations || []).length > 0 ? Math.max(...(weatherData.sampled_observations || []).map(o => o.wind_speed)) : 0} knots
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <CloudRain className="w-4 h-4 text-teal-600" />
                  <span>Storm Risk</span>
                </div>
                <div className="text-xl font-black text-slate-900">{weatherData.storm_risk}/100</div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                  {(weatherData?.sampled_observations || []).some(o => o.storm_detected) ? 'Storm Detected' : 'No Storm Pattern'}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Thermometer className="w-4 h-4 text-rose-600" />
                  <span>Avg Sea Temp</span>
                </div>
                <div className="text-xl font-black text-slate-900">
                  {(
                    weatherData.sampled_observations.reduce((acc, o) => acc + o.temperature, 0) /
                    weatherData.sampled_observations.length
                  ).toFixed(1)}
                  °C
                </div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">Surface Marine Temp</div>
              </div>
            </div>
          </div>

          {/* Alternative Route Advisory Banner */}
          {weatherData.alternative_route_advice?.recommended && (
            <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-3xl flex items-start gap-4">
              <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl font-black shrink-0">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm">
                    AI Weather Routing Advisory: Alternative Route Recommended
                  </span>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-black text-[10px] rounded-full">
                    Saves {weatherData.alternative_route_advice.delayMitigationHours} Hours
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {weatherData.alternative_route_advice.reason}
                </p>
                <div className="text-[11px] font-bold text-amber-800 pt-1">
                  Suggested Route: {weatherData.alternative_route_advice.alternativeRouteName} (+{weatherData.alternative_route_advice.distanceDeltaNm} nm nautical deviation)
                </div>
              </div>
            </div>
          )}

          {/* Sampled Waypoints Along Maritime Route */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Sampled Waypoint Met Observations</h3>
                <p className="text-xs text-slate-500">Live coordinates, barometric pressure, wave height, and wind vectors</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold font-mono">
                {(weatherData?.sampled_observations || []).length} Waypoints Sampled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(weatherData?.sampled_observations || []).map((obs, idx) => (
                <div
                  key={obs.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    obs.storm_detected
                      ? 'bg-red-50/60 border-red-200 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-black rounded-lg">
                      POINT {idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        obs.storm_detected ? 'bg-red-200 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {obs.weather_condition}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-slate-900 mb-1">{obs.waypoint_name}</div>
                  <div className="text-[10px] text-slate-500 font-mono mb-3">
                    {obs.latitude.toFixed(2)}°N, {obs.longitude.toFixed(2)}°E
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-medium pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block text-[10px]">WAVE HEIGHT</span>
                      <span className="font-bold text-slate-800">{obs.wave_height} m</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">WIND VECTOR</span>
                      <span className="font-bold text-slate-800">{obs.wind_speed} kt ({obs.wind_direction})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">PRESSURE</span>
                      <span className="font-bold text-slate-800">{obs.pressure} hPa</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">VISIBILITY</span>
                      <span className="font-bold text-slate-800">{obs.visibility} km</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CUSTOMS INTELLIGENCE & RAG REGULATION CORPUS                       */}
      {/* ========================================================================= */}
      {activeTab === 'customs' && (
        <div id="m3-tab-content-customs" className="space-y-6">
          {/* Top Row: HS Code Validator & Readiness Score */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: HS Code / Commodity Input (6 Cols) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">HS Code & Trade Classification</h3>
                <p className="text-xs text-slate-500">CBIC Tariff 2026, DGFT Foreign Trade Policy & Sanction Screen</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ORIGIN COUNTRY</label>
                  <input
                    type="text"
                    value={customsOrigin}
                    onChange={e => setCustomsOrigin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">DESTINATION COUNTRY</label>
                  <input
                    type="text"
                    value={customsDest}
                    onChange={e => setCustomsDest(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">HS CODE (6 TO 8 DIGIT)</label>
                <select
                  value={selectedHsCode}
                  onChange={e => {
                    setSelectedHsCode(e.target.value);
                    const item = SEEDED_HS_CODES.find(h => h.hs_code === e.target.value);
                    if (item) setCommodityText(item.description);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                >
                  {SEEDED_HS_CODES.map(h => (
                    <option key={h.id} value={h.hs_code}>
                      {h.hs_code} — {h.commodity_type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">COMMODITY DESCRIPTION</label>
                <input
                  type="text"
                  value={commodityText}
                  onChange={e => setCommodityText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-2">
                <button
                  id="btn-validate-customs-compliance"
                  onClick={handleValidateCustoms}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Run Automated Customs Compliance Validation</span>
                </button>
              </div>
            </div>

            {/* Right: Readiness Score & Required Documents (6 Cols) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Customs Readiness Score</h3>
                    <p className="text-xs text-slate-500">Document Completeness & Regulatory Status</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      customsCheck.status === 'PASS' || customsCheck.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : customsCheck.status === 'NEEDS_DOCUMENTS'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    STATUS: {customsCheck.status}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 my-2">
                  <span className="text-4xl font-black text-slate-900">{customsCheck.readiness_score}%</span>
                  <span className="text-xs font-bold text-slate-500">
                    ({customsCheck.verified_documents_count} of {customsCheck.mandatory_documents_count} Mandatory Documents Verified)
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full ${
                      customsCheck.readiness_score >= 90
                        ? 'bg-emerald-500'
                        : customsCheck.readiness_score >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${customsCheck.readiness_score}%` }}
                  />
                </div>

                {uploadSuccessToast && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadSuccessToast}</span>
                  </div>
                )}

                {/* Checklist items */}
                <div className="space-y-2">
                  {(customsCheck?.checklist_items || []).map(item => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                        item.status === 'VERIFIED'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-amber-50/50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {item.status === 'VERIFIED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{item.item_name}</div>
                          <div className="text-[11px] text-slate-500">{item.evidence}</div>
                        </div>
                      </div>

                      {item.status !== 'VERIFIED' && (
                        <button
                          onClick={() => handleSimulateDocUpload(item.id, `${item.requirement_id}_Signed.pdf`)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer shadow-sm"
                        >
                          Upload Doc
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono flex justify-between">
                <span>Check ID: {customsCheck.id}</span>
                <span>Audited on ICEGATE Gateway</span>
              </div>
            </div>
          </div>

          {/* RAG Regulations Semantic Retrieval Search Console */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Customs RAG Vector Knowledge Retrieval
                </h3>
                <p className="text-xs text-slate-500">
                  Semantic chunk retrieval with exact legal citations across CBIC, DGFT, EU UCC, and IMO codes
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-bold">
                Hybrid Vector Search
              </span>
            </div>

            <div className="flex items-center gap-2 mb-5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={ragQuery}
                  onChange={e => handleRagSearch(e.target.value)}
                  placeholder="Ask or search regulation corpus (e.g. advance filing, hazardous chemical MSDS, tea inspection)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                />
              </div>
              <button
                onClick={() => handleRagSearch(ragQuery)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                Retrieve
              </button>
            </div>

            {/* Chunks List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ragResults.map(chunk => (
                <div key={chunk.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-purple-900">{chunk.section_name}</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] font-mono font-bold">
                      {((chunk.relevance_score || 0.85) * 100).toFixed(0)}% Match
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "{chunk.content}"
                  </p>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Citation: {chunk.legal_citation}</span>
                    <span>Effective: {chunk.effective_from}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CUSTOMS OFFICER COMPLIANCE WORKSPACE (SIGN-OFF FLOW)                */}
      {/* ========================================================================= */}
      {activeTab === 'customs-officer' && (
        <div id="m3-tab-content-officer" className="space-y-6">
          {/* Action Success Toast */}
          {officerActionToast && (
            <div className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{officerActionToast}</span>
            </div>
          )}

          {/* Workflow Header Banner */}
          <div className="p-4 bg-amber-500/10 border border-amber-300/80 rounded-2xl text-xs text-amber-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-600" />
              <span className="font-bold">Official Customs Officer Review Console:</span>
              <span>Pending Reviews → Open Case → Document Inspection → Legal Citations Review → Sign-off</span>
            </div>
            <span className="font-mono font-bold text-amber-800 text-[11px]">
              Reviewer: {userEmail || 'customs@freighthub.in'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Pending Cases Queue (4 Cols) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">Compliance Cases Queue</h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                  {complianceCases.length} Cases
                </span>
              </div>

              {/* Status Filter */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] font-bold">
                {['ALL', 'NEEDS_REVIEW', 'NEEDS_DOCUMENTS', 'PASS', 'APPROVED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setCaseFilterStatus(f)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      caseFilterStatus === f
                        ? 'bg-slate-900 text-white font-black'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Cases List */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {(complianceCases || [])
                  .filter(c => c && (caseFilterStatus === 'ALL' || c.status === caseFilterStatus))
                  .map(c => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedCase.id === c.id
                          ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                          : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-[11px] text-slate-900">{c.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            c.status === 'PASS' || c.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'NEEDS_DOCUMENTS'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-slate-800 truncate mb-1">{c.commodity}</div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>HS: {c.hs_code}</span>
                        <span>{c.origin_port} → {c.destination_port}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right Column: Case Inspection & Sign-off Actions (8 Cols) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-blue-600">{selectedCase.id}</span>
                    <span className="text-slate-400">/</span>
                    <span className="font-mono text-xs text-slate-600">Shipment: {selectedCase.shipment_id}</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 mt-0.5">{selectedCase.commodity}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Readiness:</span>
                  <span className="text-base font-black text-slate-900">{selectedCase.readiness_score}%</span>
                </div>
              </div>

              {/* Case Metadata Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold">HS CODE</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedCase.hs_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold">INCOTERM</span>
                  <span className="font-bold text-slate-800">{selectedCase.incoterm}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold">DECLARED VALUE</span>
                  <span className="font-bold text-slate-800">₹{(selectedCase.declared_value_inr || 2500000).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold">CORRIDOR</span>
                  <span className="font-bold text-slate-800">{selectedCase.origin_port} → {selectedCase.destination_port}</span>
                </div>
              </div>

              {/* Mandatory Documents Checklist & Upload Verification */}
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider mb-2">
                  Document Requirements Checklist & Evidence:
                </h4>
                <div className="space-y-2">
                  {(selectedCase?.checklist_items || []).map(item => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.item_name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{item.description}</p>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Citation: {item.citation}</div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {item.document_uploaded ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Uploaded</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold">
                            Missing Doc
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal Citations & Findings */}
              {(selectedCase?.regulation_citations || []).length > 0 && (
                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl text-xs space-y-1.5">
                  <div className="font-bold text-purple-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>Applicable Regulatory Authority Findings:</span>
                  </div>
                  {(selectedCase?.regulation_citations || []).map((cite, i) => (
                    <div key={i} className="text-slate-700 text-[11px]">
                      <span className="font-bold">{cite.citation}: </span>
                      <span>{cite.snippet}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reviewer Notes Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  OFFICER AUDIT COMMENTS / COMPLIANCE NOTES:
                </label>
                <textarea
                  rows={2}
                  value={officerNotes}
                  onChange={e => setOfficerNotes(e.target.value)}
                  placeholder="Enter official sign-off comments, verification stamps, or document requests..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              {/* Sign-off Actions Buttons (4-WAY) */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  id="btn-officer-approve"
                  onClick={() => handleOfficerSignOff('APPROVE')}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>APPROVE</span>
                </button>

                <button
                  id="btn-officer-request-docs"
                  onClick={() => handleOfficerSignOff('REQUEST_DOCUMENTS')}
                  className="py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                >
                  <Upload className="w-4 h-4" />
                  <span>REQUEST DOCS</span>
                </button>

                <button
                  id="btn-officer-conditional"
                  onClick={() => handleOfficerSignOff('CONDITIONAL')}
                  className="py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                >
                  <Clock className="w-4 h-4" />
                  <span>CONDITIONAL</span>
                </button>

                <button
                  id="btn-officer-reject"
                  onClick={() => handleOfficerSignOff('REJECT')}
                  className="py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                >
                  <XCircle className="w-4 h-4" />
                  <span>REJECT CASE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ML PRICING & RULE-VS-ML COMPARISON STUDIO                          */}
      {/* ========================================================================= */}
      {activeTab === 'ml-pricing' && (
        <div id="m3-tab-content-ml" className="space-y-6">
          {/* ML Models Benchmark Scorecard */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Machine Learning Freight Pricing Models</h3>
                <p className="text-xs text-slate-500">
                  Model training evaluation on historical multimodal shipment logs (MAE, RMSE, and R² Score)
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                Production Champion: LightGBM
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ML_MODEL_METRICS.map(m => (
                <div
                  key={m.model_name}
                  className={`p-5 rounded-2xl border transition-all ${
                    m.is_best_model
                      ? 'bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-blue-300 shadow-md'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xs text-slate-900">{m.model_type.replace(/_/g, ' ')}</span>
                    {m.is_best_model && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-black uppercase">
                        BEST FIT
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">R² Score:</span>
                      <span className="font-bold text-slate-900 font-mono">{(m.r2_score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mean Absolute Error:</span>
                      <span className="font-bold text-emerald-700 font-mono">₹{m.mae_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Root Mean Sq Error:</span>
                      <span className="font-bold text-slate-800 font-mono">₹{m.rmse_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200">
                      <span>{m.training_samples_count.toLocaleString()} samples</span>
                      <span>{m.features_count} features</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side-by-Side Interactive Pricing Engine Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Simulation Controls (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Shipment Pricing Inputs</h3>
                <p className="text-xs text-slate-500">Simulate ML market rates vs static rate-cards</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  RULE-BASED PRICE BASELINE (INR)
                </label>
                <input
                  type="number"
                  value={mlRulePrice}
                  onChange={e => setMlRulePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">DISTANCE (NM)</label>
                  <input
                    type="number"
                    value={mlDistance}
                    onChange={e => setMlDistance(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">WEIGHT (KG)</label>
                  <input
                    type="number"
                    value={mlWeight}
                    onChange={e => setMlWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">TRANSPORT MODE</label>
                  <select
                    value={mlMode}
                    onChange={e => setMlMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="ocean">Ocean FCL/LCL</option>
                    <option value="air">Air Cargo</option>
                    <option value="express">Express Courier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CONTAINER SPEC</label>
                  <select
                    value={mlContainerSpec}
                    onChange={e => setMlContainerSpec(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="20GP">20GP Standard</option>
                    <option value="40HC">40HC High Cube</option>
                    <option value="40GP">40GP Standard</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mlHazmat}
                    onChange={e => setMlHazmat(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-bold text-slate-700">Hazardous (Hazmat)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mlReefer}
                    onChange={e => setMlReefer(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-bold text-slate-700">Reefer Temp Control</span>
                </label>
              </div>
            </div>

            {/* Side-by-Side Comparison Display (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              {mlComparison && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-extrabold text-base text-slate-900">Rule-Based vs ML Price Comparison</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        mlComparison.recommended_pricing === 'ACCEPT_RULE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mlComparison.recommended_pricing === 'ACCEPT_ML'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {mlComparison.recommended_pricing.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    {/* Rule Price Card */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        STATIC RULE-BASED PRICE
                      </span>
                      <div className="text-2xl font-black text-slate-900 font-mono">
                        ₹{(mlComparison.rule_price_inr ?? 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Tariff Table & Incoterm Formulas</div>
                    </div>

                    {/* ML Price Card */}
                    <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl">
                      <span className="text-[10px] font-bold text-blue-600 uppercase block mb-1">
                        ML PREDICTED PRICE (XGB)
                      </span>
                      <div className="text-2xl font-black text-blue-700 font-mono">
                        ₹{(mlComparison.ml_predicted_price_inr ?? 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-blue-600 mt-1">
                        95% CI: ₹{(mlComparison.ml_confidence_interval?.lower_bound_inr ?? 0).toLocaleString()} – ₹{(mlComparison.ml_confidence_interval?.upper_bound_inr ?? 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Variance Banner */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-4 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Variance Differential:</span>
                      <span
                        className={`font-mono font-bold ${
                          (mlComparison.variance_inr ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {(mlComparison.variance_inr ?? 0) >= 0 ? '+' : ''}₹{(mlComparison.variance_inr ?? 0).toLocaleString()} ({(mlComparison.variance_pct ?? 0) > 0 ? '+' : ''}{mlComparison.variance_pct ?? 0}%)
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 pt-1 leading-relaxed">
                      <span className="font-bold">ML Recommendation: </span>
                      {mlComparison.recommendation_reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Feature Importance Ranking */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Top Feature Importances in Regression Model:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  {ML_MODEL_METRICS[0].feature_importances.slice(0, 4).map(f => (
                    <div key={f.feature} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-500 block truncate">{f.feature}</span>
                      <span className="font-bold text-slate-900 font-mono">{f.importancePct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* TAB 6: PHASE 5 CUSTOMS WORKSPACE (/customs/dashboard)                      */}
      {/* ========================================================================= */}
      {activeTab === 'customs-workspace' && (
        <div id="m3-phase5-customs-workspace" className="space-y-6">
          <CustomsDashboardWorkspace
            userRole={userRole}
            userEmail={userEmail}
            onNavigateToRegulations={() => setActiveTab('regulations-library')}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PHASE 5 REGULATION LIBRARY (/customs/regulations)                   */}
      {/* ========================================================================= */}
      {activeTab === 'regulations-library' && (
        <div id="m3-phase5-regulations-library" className="space-y-6">
          <RegulationsLibraryWorkspace
            onBackToCustoms={() => setActiveTab('customs-workspace')}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: PHASE 5 RISK & WEATHER DASHBOARD (/analytics/risk)                  */}
      {/* ========================================================================= */}
      {activeTab === 'risk-weather-analytics' && (
        <div id="m3-phase5-risk-weather-analytics" className="space-y-6">
          <RiskWeatherDashboardWorkspace />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: PHASE 5 ML VS. RULE COMPARISON BENCHMARK PANEL                      */}
      {/* ========================================================================= */}
      {activeTab === 'ml-benchmark-panel' && (
        <div id="m3-phase5-ml-benchmark-panel" className="space-y-6">
          <MLPricingComparisonPanel
            ruleBasedPriceInr={mlRulePrice}
            readOnly={false}
          />
        </div>
      )}
    </div>
  );
};
