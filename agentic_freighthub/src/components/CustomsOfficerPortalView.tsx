import React, { useState, useMemo, useEffect } from 'react';
import {
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  BookOpen,
  CloudRain,
  Gauge,
  TrendingUp,
  Globe,
  Sliders,
  CheckCircle2,
  Clock,
  Search,
  FileText,
  Layers,
  Sparkles,
  AlertTriangle,
  History,
  Activity,
  Zap,
  ChevronRight,
  Database,
  ArrowRight,
  XCircle,
  Upload,
  RefreshCw,
  Eye,
  Check,
  Building,
  Anchor,
  Ship,
  Wind,
  Waves,
  Thermometer,
  ExternalLink,
  Filter,
  DollarSign,
  Download,
  Info
} from 'lucide-react';
import { CustomsOfficerSidebarNav, CustomsOfficerTab } from './CustomsOfficerSidebarNav';
import {
  CustomsComplianceCheck,
  CustomsChecklistItem,
  RegulationChunk,
  HSCodeReference,
  ShipmentRiskAssessment,
  WeatherAssessment,
  RuleVsMLComparison
} from '../types/milestone3';
import {
  SEEDED_HS_CODES,
  SEEDED_REGULATION_DOCS,
  SEEDED_REGULATION_CHUNKS,
  SEEDED_CUSTOMS_CHECKS,
  SEEDED_WEATHER_ASSESSMENTS,
  SEEDED_RISK_ASSESSMENTS,
  ML_MODEL_METRICS
} from '../data/milestone3Data';
import { assessWeatherForRoute } from '../backend/weather/weatherService';
import {
  validateCustomsCompliance,
  searchRegulationsRAG,
  signOffCustomsCheck,
  uploadShipmentDocument,
  getAllComplianceChecks
} from '../backend/customs/customsService';
import { assessShipmentCompositeRisk } from '../backend/risk/riskEngine';
import { predictMLPrice, compareRuleVsMLPricing } from '../backend/pricing/mlPricingService';
import { TrackingView } from './TrackingView';
import { M4CustomsVerificationView } from './M4CustomsVerificationView';
import { PORTS_AND_HUBS } from '../data/freightData';
import { formatCurrency } from '../utils/calculator';

interface CustomsOfficerDecision {
  caseId: string;
  shipmentId: string;
  quoteId?: string;
  action: 'APPROVE' | 'REQUEST_DOCUMENTS' | 'CONDITIONAL' | 'REJECT';
  status: string;
  officerEmail: string;
  officerName: string;
  notes: string;
  readinessScore: number;
}

interface CustomsOfficerPortalViewProps {
  officerName?: string;
  officerEmail?: string;
  onLogout?: () => void;
  initialTab?: CustomsOfficerTab;
  onCustomsDecision?: (decision: CustomsOfficerDecision) => void;
}

interface AuditLogEntry {
  id: string;
  caseId: string;
  shipmentId: string;
  action: 'APPROVE' | 'REQUEST_DOCUMENTS' | 'CONDITIONAL' | 'REJECT';
  officerName: string;
  officerEmail: string;
  timestamp: string;
  notes: string;
  readinessScore: number;
}

export const CustomsOfficerPortalView: React.FC<CustomsOfficerPortalViewProps> = ({
  officerName = 'Rajesh Varma',
  officerEmail = 'customer.officer@freighthub.in',
  onLogout,
  initialTab = 'overview',
  onCustomsDecision,
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<CustomsOfficerTab>(initialTab);

  // Case Management State
  // Live store includes seeded demo checks PLUS real customer-generated compliance cases (M3 wiring)
  const [complianceCases, setComplianceCases] = useState<CustomsComplianceCheck[]>(() => {
    const live = getAllComplianceChecks();
    const merged = [...live];
    SEEDED_CUSTOMS_CHECKS.forEach((seed) => {
      if (!merged.some((c) => c.id === seed.id)) merged.push(seed);
    });
    return merged;
  });
  const [selectedCase, setSelectedCase] = useState<CustomsComplianceCheck>(() => {
    const live = getAllComplianceChecks();
    const pool = live.length ? live : SEEDED_CUSTOMS_CHECKS;
    return pool.find((c) => c.status === 'NEEDS_REVIEW') || pool[0];
  });
  const [caseFilterStatus, setCaseFilterStatus] = useState<string>('ALL');
  const [officerNotes, setOfficerNotes] = useState<string>('');
  const [officerActionToast, setOfficerActionToast] = useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'LOG-8921',
      caseId: 'CHK-2026-001',
      shipmentId: 'SHP-1001',
      action: 'APPROVE',
      officerName: officerName,
      officerEmail: officerEmail,
      timestamp: '2026-08-26 14:32:10 UTC',
      notes: 'Pre-flight ICEGATE clearance validated. All 4 mandatory commercial docs verified.',
      readinessScore: 100
    },
    {
      id: 'LOG-8919',
      caseId: 'CHK-2026-003',
      shipmentId: 'SHP-1003',
      action: 'CONDITIONAL',
      officerName: officerName,
      officerEmail: officerEmail,
      timestamp: '2026-08-25 18:15:44 UTC',
      notes: 'Agricultural tea shipment approved pending phytosanitary physical container seal inspection at Nhava Sheva gate.',
      readinessScore: 75
    }
  ]);

  // RAG Search State
  const [ragQuery, setRagQuery] = useState<string>('Commercial Invoice HS 8471 advance filing');
  const [ragResults, setRagResults] = useState<RegulationChunk[]>(SEEDED_REGULATION_CHUNKS);

  // HS Code Directory State
  const [hsSearchTerm, setHsSearchTerm] = useState<string>('');
  const [selectedHsCategory, setSelectedHsCategory] = useState<string>('ALL');
  const [simDeclaredValue, setSimDeclaredValue] = useState<number>(2500000);
  const [simSelectedHs, setSimSelectedHs] = useState<HSCodeReference>(SEEDED_HS_CODES[0]);

  // Risk Engine State
  const [riskAssessment, setRiskAssessment] = useState<ShipmentRiskAssessment>(SEEDED_RISK_ASSESSMENTS['SHP-1002']);
  const [simWeatherScore, setSimWeatherScore] = useState<number>(24);
  const [simCustomsScore, setSimCustomsScore] = useState<number>(18);
  const [simRouteScore, setSimRouteScore] = useState<number>(22);
  const [simPortScore, setSimPortScore] = useState<number>(20);
  const [simCargoScore, setSimCargoScore] = useState<number>(15);

  // Weather State
  const [weatherOrigin, setWeatherOrigin] = useState<string>('INNSA');
  const [weatherDest, setWeatherDest] = useState<string>('AEJEA');
  const [weatherData, setWeatherData] = useState<WeatherAssessment>(SEEDED_WEATHER_ASSESSMENTS['NSA-JEA'] || SEEDED_WEATHER_ASSESSMENTS['MAA-SGSIN']);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);

  // ML Pricing State
  const [mlDistance, setMlDistance] = useState<number>(1850);
  const [mlWeight, setMlWeight] = useState<number>(3800);
  const [mlMode, setMlMode] = useState<string>('ocean');
  const [mlContainerSpec, setMlContainerSpec] = useState<string>('20GP');
  const [mlHazmat, setMlHazmat] = useState<boolean>(false);
  const [mlReefer, setMlReefer] = useState<boolean>(false);
  const [mlRulePrice, setMlRulePrice] = useState<number>(118500);
  const [mlComparison, setMlComparison] = useState<RuleVsMLComparison | null>(null);

  // Counts for Badges
  const pendingCasesCount = useMemo(() => {
    return (complianceCases || []).filter(
      (c) => c && (c.status === 'NEEDS_REVIEW' || c.status === 'NEEDS_DOCUMENTS')
    ).length;
  }, [complianceCases]);

  // Filtered Compliance Cases
  const filteredCases = useMemo(() => {
    if (caseFilterStatus === 'ALL') return complianceCases || [];
    return (complianceCases || []).filter((c) => c && c.status === caseFilterStatus);
  }, [complianceCases, caseFilterStatus]);

  // Filtered HS Codes
  const filteredHsCodes = useMemo(() => {
    return (SEEDED_HS_CODES || []).filter((h) => {
      if (!h) return false;
      const matchSearch =
        !hsSearchTerm ||
        (h.hs_code || '').toLowerCase().includes(hsSearchTerm.toLowerCase()) ||
        (h.description || '').toLowerCase().includes(hsSearchTerm.toLowerCase()) ||
        (h.commodity_type || '').toLowerCase().includes(hsSearchTerm.toLowerCase());
      const matchCat =
        selectedHsCategory === 'ALL' ||
        (selectedHsCategory === 'RESTRICTED' && (h.restricted || h.prohibited)) ||
        (selectedHsCategory === 'DUTY_FREE' && h.basic_customs_duty_pct === 0) ||
        (selectedHsCategory === 'HAZMAT' && h.chapter === '29');
      return matchSearch && matchCat;
    });
  }, [hsSearchTerm, selectedHsCategory]);

  // Handle RAG Semantic Search
  const handleExecuteRagSearch = (query: string) => {
    setRagQuery(query);
    const results = searchRegulationsRAG(query);
    setRagResults(results);
  };

  // Handle Document Upload Simulation
  const handleSimulateDocUpload = (checklistItemId: string, docName: string) => {
    uploadShipmentDocument({
      shipment_id: selectedCase.shipment_id,
      customs_check_id: selectedCase.id,
      file_name: docName,
      document_type: docName.includes('MSDS') ? 'MSDS_HAZMAT' : 'COMMERCIAL_INVOICE',
      file_size_kb: 480,
    });

    setComplianceCases((prev) =>
      prev.map((item) => {
        if (item.id === selectedCase.id) {
          const updatedItems = (item.checklist_items || []).map((chk) =>
            chk.id === checklistItemId
              ? {
                  ...chk,
                  status: 'VERIFIED' as const,
                  document_uploaded: true,
                  uploaded_file_name: docName,
                }
              : chk
          );
          const verified = (updatedItems || []).filter((i) => i && i.status === 'VERIFIED').length;
          const readiness = Math.round(
            (verified / Math.max(1, item.mandatory_documents_count)) * 100
          );
          const updatedCase = {
            ...item,
            checklist_items: updatedItems,
            uploaded_documents_count: (updatedItems || []).filter((i) => i && i.document_uploaded).length,
            verified_documents_count: verified,
            readiness_score: readiness,
            status: readiness >= 100 ? ('PASS' as const) : item.status,
          };
          setSelectedCase(updatedCase);
          return updatedCase;
        }
        return item;
      })
    );

    setOfficerActionToast(`Uploaded & ICEGATE validated: ${docName}`);
    setTimeout(() => setOfficerActionToast(null), 3500);
  };

  // Handle Customs Officer Sign-off Action
  const handleOfficerSignOff = (
    action: 'APPROVE' | 'REQUEST_DOCUMENTS' | 'CONDITIONAL' | 'REJECT'
  ) => {
    const updated = signOffCustomsCheck(
      selectedCase.id,
      action,
      officerEmail,
      officerNotes || `Officer sign-off recorded under action ${action}`
    );

    if (updated) {
      setSelectedCase(updated);
      setComplianceCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

      // Add to Audit Trail
      const newLog: AuditLogEntry = {
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        caseId: selectedCase.id,
        shipmentId: selectedCase.shipment_id,
        action: action,
        officerName: officerName,
        officerEmail: officerEmail,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        notes: officerNotes || `Officer action ${action} confirmed.`,
        readinessScore: updated.readiness_score
      };
      setAuditLogs((prev) => [newLog, ...prev]);

      setOfficerActionToast(
        `Case ${selectedCase.id} successfully updated: ${action}. Audit entry saved.`
      );
      setTimeout(() => setOfficerActionToast(null), 4000);
      setOfficerNotes('');

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

      // Propagate decision to the shared quote store (Customer / Freight Agent / Admin visibility)
      onCustomsDecision?.({
        caseId: selectedCase.id,
        shipmentId: selectedCase.shipment_id || 'UNKNOWN',
        quoteId: selectedCase.quote_id,
        action,
        status: updated.status,
        officerEmail,
        officerName,
        notes: officerNotes || `Officer action ${action} confirmed.`,
        readinessScore: updated.readiness_score,
      });
    }
  };

  // Recalculate Composite Risk on Slider Change
  useEffect(() => {
    const res = assessShipmentCompositeRisk({
      shipmentId: selectedCase.shipment_id || 'SHP-1002',
      quoteId: selectedCase.quote_id || 'Q-9842',
      weatherScore: simWeatherScore,
      customsScore: simCustomsScore,
      routeScore: simRouteScore,
      portScore: simPortScore,
      cargoScore: simCargoScore,
      customsStatus: selectedCase.status,
      customsSignoffCompleted: selectedCase.status === 'APPROVED' || selectedCase.status === 'PASS',
    });
    setRiskAssessment(res);
  }, [simWeatherScore, simCustomsScore, simRouteScore, simPortScore, simCargoScore, selectedCase]);

  // Weather Assessment Handler
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
    }, 400);
  };

  // ML Pricing recalculation
  useEffect(() => {
    const comp = compareRuleVsMLPricing(
      selectedCase.quote_id || 'Q-9842',
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
  }, [mlDistance, mlWeight, mlMode, mlContainerSpec, mlHazmat, mlReefer, mlRulePrice, selectedCase]);

  return (
    <div id="customer-officer-portal-root" className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Officer Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border border-amber-800/40 rounded-3xl p-6 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/30 flex items-center justify-center font-black">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                COMPLIANCE & CUSTOMER OPERATIONS DESK
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Session
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Customer Officer Operations & Compliance Portal
            </h1>
            <p className="text-xs text-slate-300">
              Officer: <span className="text-amber-300 font-bold">{officerName}</span> ({officerEmail}) · Central Customs & Regulatory Verification
            </p>
          </div>
        </div>

        {/* Quick Summary Pill & Logout */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-2xl text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Pending Cases</div>
            <div className="text-sm font-black text-amber-400">{pendingCasesCount} To Sign Off</div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              Log Out
            </button>
          )}
        </div>
      </div>

      {/* Officer Action Toast Notification */}
      {officerActionToast && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-white">{officerActionToast}</div>
          </div>
          <button
            onClick={() => setOfficerActionToast(null)}
            className="text-emerald-200 hover:text-white text-xs font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2-COLUMN LAYOUT: LEFT NAVIGATION BAR + MAIN RIGHT CONTENT                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT NAVIGATION BAR (3 Cols, Sticky) */}
        <div className="lg:col-span-3 lg:sticky lg:top-20 z-10">
          <CustomsOfficerSidebarNav
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            pendingCasesCount={pendingCasesCount}
            officerName={officerName}
            officerEmail={officerEmail}
          />
        </div>

        {/* RIGHT MAIN CONTENT (9 Cols) */}
        <div className="lg:col-span-9 space-y-6">

          {/* ===================================================================== */}
          {/* VIEW 1: DESK OVERVIEW & KPIS                                          */}
          {/* ===================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              {/* KPI Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Active Queue
                    </span>
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{complianceCases.length}</div>
                  <p className="text-[11px] text-slate-500">Total verified consignments</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                      Pending Sign-Off
                    </span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-600">{pendingCasesCount}</div>
                  <p className="text-[11px] text-slate-500">Requires officer determination</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                      ICEGATE Ready
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {(complianceCases || []).filter((c) => c && (c.status === 'PASS' || c.status === 'APPROVED')).length}
                  </div>
                  <p className="text-[11px] text-slate-500">100% document clearance</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">
                      Risk Index
                    </span>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                      <Gauge className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-purple-700">{riskAssessment.overall_score} / 100</div>
                  <p className="text-[11px] text-slate-500">5-factor composite baseline</p>
                </div>
              </div>

              {/* Quick Jump & Urgent Review Queue */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-amber-600" />
                      <span>Urgent Officer Sign-Off Queue</span>
                    </h3>
                    <p className="text-xs text-slate-500">Consignments requiring immediate regulatory sign-off before export loading</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('case-console')}
                    className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Full Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {complianceCases.slice(0, 3).map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-900">{c.id}</span>
                          <span className="text-[10px] text-slate-400 font-bold">• Ref: {c.shipment_id}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              c.status === 'PASS' || c.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'NEEDS_REVIEW'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-800">
                          {c.commodity} <span className="font-mono text-slate-500 font-normal">({c.hs_code})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          <span>Route: <strong className="text-slate-700">{c.origin_country} ➔ {c.destination_country}</strong></span>
                          <span>Incoterm: <strong className="text-slate-700">{c.incoterm}</strong></span>
                          <span>Readiness: <strong className="text-blue-600">{c.readiness_score}%</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCase(c);
                          setActiveTab('case-console');
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 self-start sm:self-center"
                      >
                        Inspect & Sign Off →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Module Shortcuts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setActiveTab('rag-regulations')}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:border-purple-300 hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900">RAG Regulations Search</h4>
                  <p className="text-xs text-slate-500">CBIC ICEGATE & DGFT policy knowledge base with semantic clause retrieval.</p>
                  <span className="text-xs font-black text-purple-600 flex items-center gap-1">Search Rules →</span>
                </div>

                <div
                  onClick={() => setActiveTab('hs-tariffs')}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit">
                    <Database className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900">HS Code Tariff Matrix</h4>
                  <p className="text-xs text-slate-500">8-digit tariff directory, Basic Customs Duty (BCD), IGST & statutory SWS calculator.</p>
                  <span className="text-xs font-black text-blue-600 flex items-center gap-1">Browse Tariffs →</span>
                </div>

                <div
                  onClick={() => setActiveTab('risk-engine')}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900">5-Pillar Risk Simulator</h4>
                  <p className="text-xs text-slate-500">Interactive weights: Weather, Port, Route, Cargo and Customs compliance scoring.</p>
                  <span className="text-xs font-black text-indigo-600 flex items-center gap-1">Run Simulation →</span>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW 2: CASE SIGN-OFF CONSOLE                                         */}
          {/* ===================================================================== */}
          {activeTab === 'case-console' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                {/* Header & Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      REGULATORY SIGN-OFF DESK
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      Consignment Compliance Case Sign-Off
                    </h3>
                    <p className="text-xs text-slate-500">
                      Review ICEGATE mandatory documentation, tariff duties, and issue cryptographic sign-off.
                    </p>
                  </div>

                  {/* Status Filters */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['ALL', 'NEEDS_REVIEW', 'PASS', 'REJECTED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setCaseFilterStatus(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          caseFilterStatus === st
                            ? 'bg-slate-900 text-white font-black'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split Case Selector & Active Case Inspector */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Cases List (4 Cols) */}
                  <div className="lg:col-span-5 space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                      Cases Queue ({filteredCases.length})
                    </h4>
                    <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                      {filteredCases.map((c) => {
                        const isSelected = selectedCase.id === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCase(c)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-1.5 ${
                              isSelected
                                ? 'bg-amber-50/80 border-amber-400 shadow-sm ring-1 ring-amber-400'
                                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-black text-slate-900">{c.id}</span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                  c.status === 'PASS' || c.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : c.status === 'NEEDS_REVIEW'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {c.status}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-800 line-clamp-1">{c.commodity}</div>
                            <div className="text-[10px] text-slate-500 flex items-center justify-between">
                              <span>HS {c.hs_code}</span>
                              <span className="font-bold text-blue-600">Readiness {c.readiness_score}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Active Case Detail & Sign-Off Desk (7 Cols) */}
                  <div className="lg:col-span-7 bg-slate-50/80 rounded-2xl p-5 border border-slate-200/90 space-y-5">
                    {/* Top Case Meta */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono text-sm font-black text-slate-900">{selectedCase.id}</h4>
                          <span className="text-xs text-slate-500 font-bold">Shipment: {selectedCase.shipment_id}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedCase.commodity}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400">Readiness Score</span>
                        <div className="text-lg font-black text-blue-600">{selectedCase.readiness_score}%</div>
                      </div>
                    </div>

                    {/* Trade & Customs Specs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-bold block">Trade Lane</span>
                        <span className="font-black text-slate-800">{selectedCase.origin_country} ➔ {selectedCase.destination_country}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-bold block">Incoterm</span>
                        <span className="font-black text-slate-800">{selectedCase.incoterm}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-bold block">Basic Duty (BCD)</span>
                        <span className="font-black text-slate-800">{selectedCase.basic_customs_duty_pct}%</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-bold block">IGST Rate</span>
                        <span className="font-black text-slate-800">{selectedCase.igst_pct}%</span>
                      </div>
                    </div>

                    {/* Mandatory Documents Checklist */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <FileCheck2 className="w-4 h-4 text-blue-600" />
                          Mandatory ICEGATE Documents Checklist
                        </span>
                        <span className="text-[11px] text-slate-500 font-bold">
                          {selectedCase.verified_documents_count} of {selectedCase.mandatory_documents_count} Verified
                        </span>
                      </div>

                      <div className="space-y-2">
                        {(selectedCase.checklist_items || []).map((item) => (
                          <div
                            key={item.id}
                            className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{item.item_name}</span>
                                <span
                                  className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                                    item.status === 'VERIFIED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">{item.description}</p>
                              {item.uploaded_file_name && (
                                <p className="text-[10px] text-blue-600 font-mono">📎 {item.uploaded_file_name}</p>
                              )}
                            </div>

                            {item.status !== 'VERIFIED' && (
                              <button
                                onClick={() => handleSimulateDocUpload(item.id, `${item.item_name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}_verified.pdf`)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors shrink-0 cursor-pointer self-start sm:self-center"
                              >
                                Upload & Verify
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Officer Notes Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Compliance Determination Notes</span>
                        <span className="text-[10px] text-slate-400 font-normal">Appended to immutable audit trail</span>
                      </label>
                      <textarea
                        rows={2}
                        value={officerNotes}
                        onChange={(e) => setOfficerNotes(e.target.value)}
                        placeholder="Enter statutory inspection notes or condition prerequisites..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Sign-Off Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleOfficerSignOff('APPROVE')}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>APPROVE CONSIGNMENT</span>
                      </button>

                      <button
                        onClick={() => handleOfficerSignOff('CONDITIONAL')}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>CONDITIONAL PASS</span>
                      </button>

                      <button
                        onClick={() => handleOfficerSignOff('REQUEST_DOCUMENTS')}
                        className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>REQUEST DOCS</span>
                      </button>

                      <button
                        onClick={() => handleOfficerSignOff('REJECT')}
                        className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>REJECT</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW 3: RAG REGULATIONS & DGFT SEARCH                                */}
          {/* ===================================================================== */}
          {activeTab === 'rag-regulations' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    SEMANTIC RAG KNOWLEDGE BASE
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    CBIC Customs & DGFT Regulation Search
                  </h3>
                  <p className="text-xs text-slate-500">
                    Query customs notifications, mandatory certificate prerequisites, and restricted commodity clauses.
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={ragQuery}
                    onChange={(e) => handleExecuteRagSearch(e.target.value)}
                    placeholder="Search regulatory clauses (e.g., HS 8471, advance filing, reefer inspection)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Quick Topic Chips */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    'Commercial Invoice HS 8471',
                    'Hazardous chemical MSDS Class 3',
                    'CECA Certificate of Origin Form A',
                    'DGFT Restricted Commodity List 2026',
                    'ITA-1 Duty Exemption IT Goods',
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleExecuteRagSearch(chip)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        ragQuery === chip
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-900'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* RAG Results List */}
              <div className="space-y-4">
                <div className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Indexed Regulatory Clauses ({ragResults.length} Matched)
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {ragResults.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-white transition-all space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-mono text-[10px] font-black">
                            {chunk.documentId || chunk.regulation_document_id}
                          </span>
                          <span className="text-xs font-black text-slate-900">{chunk.section_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                          <span>Relevance:</span>
                          <span className="text-emerald-600 font-black">
                            {Math.round(chunk.relevance_score * 100)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">{chunk.content}</p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {(chunk.keywords || []).map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-semibold"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW 4: HS CODE TARIFF DIRECTORY                                     */}
          {/* ===================================================================== */}
          {activeTab === 'hs-tariffs' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    TARIFF DIRECTORY & SIMULATOR
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Harmonized System (HS) Tariff & Duty Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official 8-digit tariff headings, Basic Customs Duty (BCD), IGST, and statutory SWS calculator.
                  </p>
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={hsSearchTerm}
                    onChange={(e) => setHsSearchTerm(e.target.value)}
                    placeholder="Search HS Code, description, or commodity type..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {['ALL', 'DUTY_FREE', 'RESTRICTED', 'HAZMAT'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedHsCategory(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedHsCategory === cat
                          ? 'bg-blue-600 text-white font-black shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Tariff Table & Interactive Duty Calculator */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: HS Directory (7 Cols) */}
                <div className="lg:col-span-7 space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filteredHsCodes.map((hs) => {
                    const isSelected = simSelectedHs.id === hs.id;
                    return (
                      <div
                        key={hs.id}
                        onClick={() => setSimSelectedHs(hs)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-400 shadow-sm ring-1 ring-blue-400'
                            : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                              {hs.hs_code}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{hs.commodity_type}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              hs.basic_customs_duty_pct === 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            BCD: {hs.basic_customs_duty_pct}%
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2">{hs.description}</p>

                        <div className="text-[10px] text-slate-500 flex items-center gap-4">
                          <span>IGST: <strong>{hs.igst_pct}%</strong></span>
                          <span>Heading: <strong>{hs.heading}</strong></span>
                          <span>Agreement: <strong>{hs.source.split('/')[0]}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Instant Duty Calculator (5 Cols) */}
                <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400">
                        STATUTORY DUTY ENGINE
                      </span>
                      <h4 className="text-sm font-black text-white">Customs Assessment</h4>
                    </div>
                    <span className="font-mono text-xs text-cyan-300 font-bold">{simSelectedHs.hs_code}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Declared CIF Consignment Value (INR)
                    </label>
                    <input
                      type="number"
                      value={simDeclaredValue}
                      onChange={(e) => setSimDeclaredValue(Math.max(1000, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Calculated Duty Stack */}
                  <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Basic Customs Duty ({simSelectedHs.basic_customs_duty_pct}%):</span>
                      <span className="font-bold font-mono">
                        {formatCurrency(simDeclaredValue * (simSelectedHs.basic_customs_duty_pct / 100), 'INR')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span>Social Welfare Surcharge (10% on BCD):</span>
                      <span className="font-bold font-mono">
                        {formatCurrency(
                          simDeclaredValue * (simSelectedHs.basic_customs_duty_pct / 100) * 0.10,
                          'INR'
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span>Integrated GST (IGST {simSelectedHs.igst_pct}%):</span>
                      <span className="font-bold font-mono">
                        {formatCurrency(
                          (simDeclaredValue + simDeclaredValue * (simSelectedHs.basic_customs_duty_pct / 100)) *
                            (simSelectedHs.igst_pct / 100),
                          'INR'
                        )}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-sm font-black text-cyan-400">
                      <span>Total Estimated Duty:</span>
                      <span className="font-mono">
                        {formatCurrency(
                          simDeclaredValue * (simSelectedHs.basic_customs_duty_pct / 100) +
                            simDeclaredValue * (simSelectedHs.basic_customs_duty_pct / 100) * 0.10 +
                            (simDeclaredValue + simDeclaredValue * (simSelectedHs.basic_customs_duty_pct / 100)) *
                              (simSelectedHs.igst_pct / 100),
                          'INR'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW 5: COMPOSITE RISK ENGINE                                         */}
          {/* ===================================================================== */}
          {activeTab === 'risk-engine' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    5-PILLAR RISK SIMULATOR
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Shipment Risk Index & Sensitivity Engine
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mathematical aggregation of Weather (30%), Customs (25%), Route Passages (20%), Port Congestion (15%), and Cargo Specifications (10%).
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    riskAssessment.risk_level === 'LOW'
                      ? 'bg-emerald-100 text-emerald-800'
                      : riskAssessment.risk_level === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {riskAssessment.risk_level} RISK LEVEL
                </span>
              </div>

              {/* Top Score Display */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                    Composite Mathematical Output
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-black text-white">{riskAssessment.overall_score}</span>
                    <span className="text-xs font-bold text-slate-400">/ 100 Risk Points</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Gating Threshold: Consignments with score &gt;50 require mandatory customer officer sign-off.
                  </p>
                </div>

                <div className="w-full md:w-72 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">Risk Severity</span>
                    <span className="text-cyan-400">{riskAssessment.overall_score}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        riskAssessment.overall_score <= 35
                          ? 'bg-emerald-500'
                          : riskAssessment.overall_score <= 60
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, riskAssessment.overall_score))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 5 Interactive Sensitivity Sliders */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Interactive Risk Factor Sliders
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">1. Marine Weather & Storm Factor (30%)</span>
                      <span className="font-mono font-black text-blue-600">{simWeatherScore} pts</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={simWeatherScore}
                      onChange={(e) => setSimWeatherScore(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">2. Customs & Document Deficiency (25%)</span>
                      <span className="font-mono font-black text-blue-600">{simCustomsScore} pts</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={simCustomsScore}
                      onChange={(e) => setSimCustomsScore(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">3. Geopolitical & Corridor Passages (20%)</span>
                      <span className="font-mono font-black text-blue-600">{simRouteScore} pts</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={simRouteScore}
                      onChange={(e) => setSimRouteScore(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">4. Port Berthing & Terminal Delay (15%)</span>
                      <span className="font-mono font-black text-blue-600">{simPortScore} pts</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={simPortScore}
                      onChange={(e) => setSimPortScore(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">5. Cargo Sensitivity (Hazmat/Reefer/High-Value) (10%)</span>
                      <span className="font-mono font-black text-blue-600">{simCargoScore} pts</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={simCargoScore}
                      onChange={(e) => setSimCargoScore(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW 6: MARINE WEATHER RADAR                                         */}
          {/* ===================================================================== */}
          {activeTab === 'weather-radar' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                    NOAA GFS & IMD RADAR
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Marine Weather Radar & Ocean State Assessment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time significant wave swell heights, Beaufort wind scale, and storm delay buffer calculation.
                  </p>
                </div>
              </div>

              {/* Corridor Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Origin Port</label>
                  <select
                    value={weatherOrigin}
                    onChange={(e) => {
                      setWeatherOrigin(e.target.value);
                      handleAssessWeather(e.target.value, weatherDest);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    {PORTS_AND_HUBS.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Destination Port</label>
                  <select
                    value={weatherDest}
                    onChange={(e) => {
                      setWeatherDest(e.target.value);
                      handleAssessWeather(weatherOrigin, e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    {PORTS_AND_HUBS.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => handleAssessWeather(weatherOrigin, weatherDest)}
                    disabled={isWeatherLoading}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isWeatherLoading ? 'animate-spin' : ''}`} />
                    <span>Scan Sea Lanes</span>
                  </button>
                </div>
              </div>

              {/* Weather Data Display Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase">Wave Swell Height</span>
                  <div className="text-3xl font-black text-white">{Math.max(0, ...(weatherData.sampled_observations || []).map(o => o.wave_height))} m</div>
                  <p className="text-xs text-slate-400">Nominal navigational swell</p>
                </div>

                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase">Beaufort Wind Vector</span>
                  <div className="text-3xl font-black text-white">{Math.max(0, ...(weatherData.sampled_observations || []).map(o => o.wind_speed))} kts</div>
                  <p className="text-xs text-slate-400">Beaufort Force 4 (Moderate)</p>
                </div>

                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase">Storm Delay Buffer</span>
                  <div className="text-3xl font-black text-cyan-400">+{weatherData.expected_delay_hours} hrs</div>
                  <p className="text-xs text-slate-400">Delay probability: {(weatherData.delay_probability * 100).toFixed(0)}%</p>
                </div>
              </div>

              <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl text-xs text-cyan-900 font-medium">
                <strong>Meteorological Advisory:</strong>{' '}
                {(weatherData.active_alerts || []).length > 0
                  ? weatherData.active_alerts[0].message
                  : (weatherData.sampled_observations || []).some((o) => o.storm_detected)
                  ? 'Storm activity detected along corridor. Expect potential transit delays and berth congestion.'
                  : 'Sea state nominal. No adverse marine weather along the assessed corridor.'}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW 7: ML SPOT RATE PRICING MODEL                                    */}
          {/* ===================================================================== */}
          {activeTab === 'ml-pricing' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    DUAL PRICING ARCHITECTURE
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Rule-Based Tariff vs ML Spot Rate (XGBoost)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comparative pricing analysis combining deterministic cost matrices with machine learning regression (R² 0.974).
                  </p>
                </div>
              </div>

              {/* Model Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">R² Coefficient</span>
                  <div className="text-lg font-black text-indigo-600">{ML_MODEL_METRICS[0]?.r2_score ?? 0.974}</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">RMSE Deviation</span>
                  <div className="text-lg font-black text-slate-800">₹{ML_MODEL_METRICS[0]?.rmse_inr ?? 4120}</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Mean Abs Error</span>
                  <div className="text-lg font-black text-slate-800">₹{ML_MODEL_METRICS[0]?.mae_inr ?? 2840}</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Training Records</span>
                  <div className="text-lg font-black text-emerald-600">{(ML_MODEL_METRICS[0]?.training_samples_count ?? 4200).toLocaleString()}</div>
                </div>
              </div>

              {/* Comparison Output Box */}
              {mlComparison && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                    <span className="text-xs font-black uppercase text-slate-500">1. Deterministic Rule Rate</span>
                    <div className="text-3xl font-black text-slate-900">
                      {formatCurrency(mlComparison.rule_price_inr, 'INR')}
                    </div>
                    <p className="text-xs text-slate-500">Base Freight + THC + BAF Fuel Surcharge + Documentation</p>
                  </div>

                  <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/70 space-y-2">
                    <span className="text-xs font-black uppercase text-indigo-800">2. ML Predictive Spot Rate</span>
                    <div className="text-3xl font-black text-indigo-900">
                      {formatCurrency(mlComparison.ml_predicted_price_inr, 'INR')}
                    </div>
                    <p className="text-xs text-indigo-700">
                      Variance Delta: <strong>{mlComparison.variance_pct > 0 ? `+${mlComparison.variance_pct}%` : `${mlComparison.variance_pct}%`}</strong> • Confidence 97.4%
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW 8: FLEET & CARGO TRACKING RADAR                                 */}
          {/* ===================================================================== */}
          {activeTab === 'tracking' && (
            <div className="space-y-6 animate-in fade-in">
              <TrackingView userRole="customer-officer" />
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW 9: M4 CUSTOMS VERIFICATIONS                                      */}
          {/* ===================================================================== */}
          {activeTab === 'm4-verifications' && (
            <M4CustomsVerificationView />
          )}

          {/* ===================================================================== */}
          {/* VIEW 10: COMPLIANCE AUDIT TRAIL                                       */}
          {/* ===================================================================== */}
          {activeTab === 'signoff-audit' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    AUDIT LEDGER
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Compliance Determinations & Officer Action Log
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cryptographically hashed audit trail of all officer sign-offs, approvals, and ICEGATE filings.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-50 space-y-2 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                          {log.id}
                        </span>
                        <span className="text-xs font-bold text-slate-800">Case {log.caseId} ({log.shipmentId})</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            log.action === 'APPROVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'CONDITIONAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">"{log.notes}"</p>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>Officer: <strong>{log.officerName}</strong> ({log.officerEmail})</span>
                      <span className="text-emerald-700 font-black">Readiness at Sign-Off: {log.readinessScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};