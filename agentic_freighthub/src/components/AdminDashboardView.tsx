import React, { useState } from 'react';
import {
  ShieldAlert,
  BarChart2,
  FileText,
  Sliders,
  MessageSquare,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Tag,
  DollarSign,
  Download,
  Eye,
  Plus,
  RefreshCw,
  Save,
  Star,
  Globe,
  Activity,
  Server,
  Layers,
  HelpCircle,
  Zap,
  Lock,
  ArrowRight,
  Check,
  Database
} from 'lucide-react';
import { SavedQuotation } from '../types';
import { formatCurrency } from '../utils/calculator';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { PROMO_COUPONS, BENCHMARK_CORRIDORS } from '../data/freightData';
import { Milestone2QuoteBuilder } from './Milestone2QuoteBuilder';
import { MasterDataAdminView } from './MasterDataAdminView';
import { AdminSidebarNav, AdminTab } from './AdminSidebarNav';
import { AdminSetupMasterConsole } from './AdminSetupMasterConsole';
import { AdminUserManagementView } from './AdminUserManagementView';
import { TrackingView } from './TrackingView';
import { AdminRiskCustomsView } from './AdminRiskCustomsView';
import { AdminIntegrationsView } from './AdminIntegrationsView';
import { AdminAlertsView } from './AdminAlertsView';
import { AdminAuditLogsView } from './AdminAuditLogsView';
import { AdminSettingsView } from './AdminSettingsView';

interface AdminDashboardViewProps {
  quotations?: SavedQuotation[];
  onViewQuotePDF: (quote: SavedQuotation) => void;
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  quotations = [],
  onViewQuotePDF,
  activeTab: externalActiveTab,
  onTabChange,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<AdminTab>('home');
  const activeTab = externalActiveTab || internalActiveTab;

  const setActiveTab = (tab: AdminTab) => {
    setInternalActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');

  // Tariff Control States
  const [oceanBaseFcl, setOceanBaseFcl] = useState<number>(125000);
  const [airBasePerKg, setAirBasePerKg] = useState<number>(250);
  const [bafPercent, setBafPercent] = useState<number>(8);
  const [thcPerTeu, setThcPerTeu] = useState<number>(9500);
  const [docFee, setDocFee] = useState<number>(3500);
  const [tariffSavedSuccess, setTariffSavedSuccess] = useState<boolean>(false);

  // Customer feedback logs
  const [sampleFeedbacks] = useState([
    {
      id: 'FB-9081',
      quoteId: 'QT-2026-9081',
      user: 'aparajita@freighthub.in',
      rating: 5,
      aspects: ['Tariff Accuracy', 'Calculation Speed', 'Transparent Surcharges'],
      comment: 'Very fast and accurate ocean FCL rate calculation for the Mundra to Rotterdam corridor!',
      date: '10 Aug 2026',
    },
    {
      id: 'FB-9079',
      quoteId: 'QT-2026-9079',
      user: 'global.logistics@sharma.com',
      rating: 4,
      aspects: ['Route Options', 'Ease of Container Spec'],
      comment: 'Breakdown of BAF and THC surcharges was clear. Saved our team a lot of manual estimation time.',
      date: '09 Aug 2026',
    },
  ]);

  const filteredQuotes = (quotations || []).filter((q) => {
    const term = (searchTerm || '').trim().toLowerCase();
    const orig = q.originCode || q.formData?.originPortCode || '';
    const dest = q.destinationCode || q.formData?.destinationPortCode || '';
    const route = q.routeSummary || '';
    const shipper = q.shipperName || '';
    const matchesSearch =
      !term ||
      (q.id || '').toLowerCase().includes(term) ||
      orig.toLowerCase().includes(term) ||
      dest.toLowerCase().includes(term) ||
      route.toLowerCase().includes(term) ||
      shipper.toLowerCase().includes(term);
    const matchesMode = filterMode === 'all' || q.transportMode === filterMode;
    return matchesSearch && matchesMode;
  });

  const handleSaveTariffs = (e: React.FormEvent) => {
    e.preventDefault();
    setTariffSavedSuccess(true);
    setTimeout(() => setTariffSavedSuccess(false), 2500);
  };

  return (
    <div className={`animate-in fade-in duration-300 ${activeTab === 'setup' ? 'space-y-4' : 'space-y-8'}`}>
      {/* Admin Top Banner & Sub-Navigation */}
      <div className={`bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-white rounded-3xl border border-purple-500/30 shadow-2xl relative overflow-hidden ${
        activeTab === 'setup' ? 'p-4 sm:p-5' : 'p-6 sm:p-8'
      }`}>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-purple-600/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className={`bg-purple-600/30 text-purple-300 rounded-2xl border border-purple-400/30 shadow-lg shadow-purple-600/20 ${
              activeTab === 'setup' ? 'p-2.5' : 'p-3.5'
            }`}>
              <ShieldAlert className={activeTab === 'setup' ? 'w-6 h-6' : 'w-8 h-8'} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                  ADMIN SYSTEM CONSOLE
                </span>
                <span className="text-xs text-purple-300 font-semibold">• Operational & Audited</span>
              </div>
              <h1 className={`font-black text-white tracking-tight ${activeTab === 'setup' ? 'text-lg mt-0.5' : 'text-2xl mt-1'}`}>
                FreightHub Administrator Portal
              </h1>
              <p className="text-xs text-slate-300">
                System administration, rate governance, commercial quote approvals & tariff oversight
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin 2-Column Layout with Left Sidebar Navigation */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 items-start ${activeTab === 'setup' ? 'gap-4' : 'gap-8'}`}>
        {/* Left Side Admin Navigation Bar */}
        <div className="lg:col-span-3 lg:sticky lg:top-20 z-10">
          <AdminSidebarNav
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            quotationsCount={quotations.length}
            feedbacksCount={sampleFeedbacks.length}
          />
        </div>

        {/* Right Side Main Content Panel */}
        <div className={`lg:col-span-9 ${activeTab === 'setup' ? 'space-y-4' : 'space-y-8'}`}>
          {/* TAB 1: ADMIN HOME PAGE - ENTERPRISE LOGISTICS SYSTEM OVERVIEW & SERVICES AT THE TOP */}
          {activeTab === 'home' && (
        <div className="space-y-8">
          {/* Admin Hero Overview */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="max-w-3xl space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>ADMINISTRATOR CONTROL ENGINE</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white">
                Enterprise Logistics System Overview & Services
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                As a FreightHub Administrator, you have full governance over freight tariff calculation formulas, Bunker Adjustment Factors (BAF), Terminal Handling Charges (THC), commercial quote approvals, customer feedback audits, and Express API health monitoring.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('setup')}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Admin Setup (5 Masters)</span>
                </button>
                <button
                  onClick={() => setActiveTab('tariffs')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-slate-700 cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Configure Base Tariffs</span>
                </button>
                <button
                  onClick={() => setActiveTab('masterdata')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-slate-700 cursor-pointer"
                >
                  <Database className="w-4 h-4 text-blue-400" />
                  <span>MongoDB Collections (19)</span>
                </button>
                <button
                  onClick={() => setActiveTab('quotations')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-slate-700 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Audit Customer Quotes ({quotations.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* ADMIN SERVICES SECTION: System Administration Modules */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">
                  Admin System Services & Operational Modules
                </h3>
                <p className="text-xs text-slate-500">
                  Administrative tools available for master prerequisites, governance and tariff adjustments
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
                Prerequisite: Admin Adds Masters First
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                onClick={() => setActiveTab('setup')}
                className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50/50 hover:from-purple-100/70 hover:to-indigo-100/70 border-2 border-purple-300 rounded-2xl transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-purple-600 text-white rounded-xl shadow-md shadow-purple-600/20">
                    <Layers className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm text-purple-950">
                    Admin Setup — 5 Core Masters
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-600 text-white uppercase">
                    Key Flow
                  </span>
                </div>
                <p className="text-xs text-purple-900/80 mt-1">
                  Customer Master (ABC Logistics), Port Master (Chennai, Singapore, Dubai, Colombo, Rotterdam), Carrier Master, Cargo Types & Shipping Routes.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('users')}
                className="p-6 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl transition-all cursor-pointer group shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-purple-500/30 border border-purple-400/40 text-purple-300 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-white">
                    User Management & Credential Studio
                  </h4>
                  <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                    Security
                  </span>
                </div>
                <p className="text-xs text-purple-200/80 mt-1">
                  Provision Broker & Admin profiles, inspect fixed usernames & emails, manage Google accounts and reset passwords.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('tariffs')}
                className="p-6 bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 rounded-2xl transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-purple-600 text-white rounded-xl shadow-md shadow-purple-600/20">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-purple-700">
                  System Tariff & Surcharge Controls
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust baseline ocean container rates, air per-kg tariffs, BAF fuel percentage, and THC charges.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('quotations')}
                className="p-6 bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 rounded-2xl transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-700">
                  Global Quotations Audit & Approvals
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Inspect every customer quotation issued on the system, preview PDF quotes, and download records.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('feedbacks')}
                className="p-6 bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 rounded-2xl transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700">
                  Customer Feedback Monitor
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Audit customer satisfaction ratings, shipper reviews, and feedback on tariff accuracy.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('tariffs')}
                className="p-6 bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 rounded-2xl transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-cyan-600 text-white rounded-xl shadow-md shadow-cyan-600/20">
                    <Tag className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-cyan-700">
                  Promo Coupon Governance
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Oversee active promotional coupon rules (`FREIGHT20`, `INLAND15`, `AIRSHIP10`) and usage statistics.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('quotations')}
                className="p-6 bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 rounded-2xl transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-slate-800 text-white rounded-xl shadow-md shadow-slate-800/20">
                    <Globe className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Global Corridor Intelligence
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Analyze key trade corridor benchmark tariffs across Mundra, Nhava Sheva, Rotterdam, Jebel Ali & Singapore.
                </p>
              </div>
            </div>
          </div>

          {/* ADMIN ABOUT SECTION: FreightHub System Architecture & Compliance */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">
                  About FreightHub System Architecture & Governance
                </h3>
                <p className="text-xs text-slate-500">
                  Comprehensive documentation of calculation formulas, API REST specs & audit standards
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-purple-700 uppercase">
                  <Zap className="w-4 h-4" />
                  <span>1. Calculation Mechanics</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  FreightHub utilizes a multi-modal tariff engine. Ocean freight calculates base FCL container rates or volumetric LCL per CBM. Air freight scales by chargeable weight (1 CBM = 167 kg standard ratio).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-blue-700 uppercase">
                  <Lock className="w-4 h-4" />
                  <span>2. Commercial Lock & Validity</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every issued commercial quote receives a unique Quote ID (e.g., QT-2026-0091) and a 14-day rate lock guarantee. Includes automated 18% GST calculation and FIATA-compliant PDF generation.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-emerald-700 uppercase">
                  <Server className="w-4 h-4" />
                  <span>3. API & Serverless Sync</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Backend Express routes (`/api/tariffs`, `/api/quotes`, `/api/feedback`) execute serverless calculations on Vercel or Node.js runtime with instant fallback to client-side state.
                </p>
              </div>
            </div>
          </div>
          {/* KPI Stat Cards (Admin Overview Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Total Quotes Audited
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">{quotations.length}</p>
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+18% from last month</span>
                </p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  System Pipeline Value
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {formatCurrency(
                    quotations.reduce((acc, q) => acc + q.breakdown.grandTotal, 0),
                    'INR'
                  )}
                </p>
                <p className="text-[11px] text-purple-600 font-bold flex items-center gap-1 mt-1">
                  <span>Active Freight Value</span>
                </p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  System Operating Margin
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">12.5%</p>
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  <span>Optimal Yield</span>
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <Activity className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Customer Satisfaction
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">4.9 / 5.0</p>
                <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>98% Positive Feedback</span>
                </p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                <Star className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: System Quotations Audit */}
      {activeTab === 'quotations' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                System Quotations Audit Log
              </h2>
              <p className="text-xs text-slate-500">
                All freight quotes generated across shipper accounts in real time
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Quote ID, Port..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Modes</option>
                <option value="ocean">Ocean Freight</option>
                <option value="air">Air Freight</option>
                <option value="express">Express Air</option>
                <option value="ground">Ground / Rail</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
                  <th className="p-3.5 pl-4">Quote ID</th>
                  <th className="p-3.5">Shipper</th>
                  <th className="p-3.5">Route Corridor</th>
                  <th className="p-3.5">Mode / Spec</th>
                  <th className="p-3.5">Grand Total</th>
                  <th className="p-3.5">Generated Date</th>
<th className="p-3.5">Customs</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-3.5 pl-4 font-black text-purple-700">{quote.id}</td>
                    <td className="p-3.5 font-bold text-slate-700">{quote.shipperName || 'Aparajita'}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <span>{quote.originCode || quote.formData?.originPortCode || 'INNSA'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{quote.destinationCode || quote.formData?.destinationPortCode || 'AEJEA'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Incoterm: {quote.formData?.incoterm || 'FOB'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                        {quote.transportMode} {quote.oceanLoadType || ''}
                      </span>
                    </td>
                    <td className="p-3.5 font-black text-slate-900">
                      {formatCurrency(quote.breakdown.grandTotal, quote.breakdown.currency)}
                    </td>
                    <td className="p-3.5 text-slate-500 font-medium">{quote.createdAt}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          quote.customsStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : quote.customsStatus === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : quote.customsStatus
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {quote.customsStatus || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3.5 pr-4 text-right space-x-1">
                      <button
                        onClick={() => onViewQuotePDF(quote)}
                        className="p-1.5 bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white rounded-lg transition-colors"
                        title="View Full Quote PDF Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => generateQuotePDF(quote)}
                        className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Tariff & Surcharge Configuration (ADMIN PRICING INTELLIGENCE & MARGIN ENGINE) */}
      {activeTab === 'tariffs' && (
        <div className="space-y-8">
          {/* Milestone 2 Execution Specification Engine for Admin Broker/Pricing Manager */}
          <Milestone2QuoteBuilder />

          <form onSubmit={handleSaveTariffs} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                System Tariff & Surcharge Management
              </h2>
              <p className="text-xs text-slate-500">
                Adjust baseline rates, BAF fuel surcharges & terminal handling fees applied live to quotes
              </p>
            </div>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-purple-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Save Tariff Rules</span>
            </button>
          </div>

          {tariffSavedSuccess && (
            <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold">
                Tariff matrix and surcharge parameters updated successfully! Live calculation engine re-indexed.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Base Ocean FCL Container Rate (₹)
              </label>
              <input
                type="number"
                value={oceanBaseFcl}
                onChange={(e) => setOceanBaseFcl(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-500">
                Baseline per 20GP container spec before distance multipliers.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Air Freight Base Rate per Kg (₹)
              </label>
              <input
                type="number"
                value={airBasePerKg}
                onChange={(e) => setAirBasePerKg(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-500">
                Standard charge per chargeable kg for air cargo shipments.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                BAF Fuel Adjustment Surcharge (%)
              </label>
              <input
                type="number"
                value={bafPercent}
                onChange={(e) => setBafPercent(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-500">
                Bunker Adjustment Factor applied to base tariff.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Terminal Handling Charge (THC) / TEU (₹)
              </label>
              <input
                type="number"
                value={thcPerTeu}
                onChange={(e) => setThcPerTeu(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-500">
                Port origin & destination container terminal charge.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Documentation & Bill of Lading Fee (₹)
              </label>
              <input
                type="number"
                value={docFee}
                onChange={(e) => setDocFee(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-500">
                Standard export/import documentation charge per quote.
              </p>
            </div>
          </div>

          {/* Active Promo Codes List */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
              Active Promo Coupons Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PROMO_COUPONS.map((coupon) => (
                <div key={coupon.code} className="p-3 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-cyan-400 tracking-wider">
                      {coupon.code}
                    </span>
                    <p className="text-[10px] text-slate-400">{coupon.description}</p>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          </div>
        </form>
        </div>
      )}

      {/* TAB 4: Shipper Feedbacks */}
      {activeTab === 'feedbacks' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
              Customer Feedbacks & Ratings
            </h2>
            <p className="text-xs text-slate-500">
              Optional feedback submitted by shippers after generating commercial quotations
            </p>
          </div>

          <div className="space-y-4">
            {sampleFeedbacks.map((fb) => (
              <div key={fb.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                      FB
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{fb.user}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                          {fb.quoteId}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{fb.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= fb.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-black text-amber-700 ml-1">{fb.rating}.0</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 font-medium italic">"{fb.comment}"</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {fb.aspects.map((aspect) => (
                    <span
                      key={aspect}
                      className="px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold border border-purple-200"
                    >
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-purple-600" />
                        <span>{aspect}</span>
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: User Management (Access Control, Credentials & Google Auth) */}
      {activeTab === 'users' && <AdminUserManagementView />}

      {/* TAB: Risk & Customs Configuration */}
      {activeTab === 'risk-customs' && <AdminRiskCustomsView />}

      {/* TAB: Integrations & Data Freshness */}
      {activeTab === 'integrations' && <AdminIntegrationsView />}

      {/* TAB: Alerts & Exception Telemetry */}
      {activeTab === 'alerts' && <AdminAlertsView />}

      {/* TAB: Audit Logs & Governance History */}
      {activeTab === 'audit-logs' && <AdminAuditLogsView />}

      {/* TAB: Settings & System Policies */}
      {activeTab === 'settings' && <AdminSettingsView />}

      {/* TAB: Admin Setup (5 Masters) */}
      {activeTab === 'setup' && (
        <AdminSetupMasterConsole
          onNavigateToQuoteTest={() => setActiveTab('quotations')}
        />
      )}

      {/* TAB: Master Data Collections (MongoDB) */}
      {activeTab === 'masterdata' && <MasterDataAdminView />}

      {/* TAB: Live Fleet Tracking & Google Map AIS Radar */}
      {activeTab === 'tracking' && (
        <div className="space-y-6 animate-in fade-in">
          <TrackingView
            userRole="admin"
            onViewQuotationPdf={(quoteId) => {
              const matched = quotations.find((q) => q.id === quoteId);
              if (matched) onViewQuotePDF(matched);
            }}
          />
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
