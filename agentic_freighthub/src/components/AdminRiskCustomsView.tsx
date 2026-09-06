import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Globe,
  Lock,
  ArrowRight,
  Sparkles,
  Download,
  Check,
  X,
  Sliders,
  Scale
} from 'lucide-react';

interface HSCodeRule {
  id: string;
  hsCode: string;
  commodityName: string;
  category: string;
  basicCustomsDutyPct: number;
  igstPct: number;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresHazmatCert: boolean;
  requiresFSSAI: boolean;
  status: 'ACTIVE' | 'RESTRICTED' | 'PROHIBITED';
  lastUpdated: string;
}

interface SanctionEntity {
  id: string;
  entityName: string;
  country: string;
  listSource: 'OFAC SDN' | 'UN Sanctions' | 'DGFT India' | 'EU Restrictive';
  riskScore: number;
  status: 'BLOCKED' | 'FLAGGED_FOR_REVIEW';
  matchReason: string;
}

import { MLPricingComparisonPanel } from './MLPricingComparisonPanel';

export const AdminRiskCustomsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'hs-rules' | 'sanctions' | 'risk-matrix' | 'ml-benchmark'>('hs-rules');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // HS Code Rules State
  const [hsRules, setHsRules] = useState<HSCodeRule[]>([
    {
      id: 'HS-001',
      hsCode: '8504.40',
      commodityName: 'Static Converters, Power Inverters & Rectifiers',
      category: 'Electronics & Electricals',
      basicCustomsDutyPct: 7.5,
      igstPct: 18,
      riskTier: 'LOW',
      requiresHazmatCert: false,
      requiresFSSAI: false,
      status: 'ACTIVE',
      lastUpdated: '2026-08-20',
    },
    {
      id: 'HS-002',
      hsCode: '3004.90',
      commodityName: 'Medicaments Formulated for Therapeutic Care',
      category: 'Pharmaceuticals',
      basicCustomsDutyPct: 0.0,
      igstPct: 12,
      riskTier: 'MEDIUM',
      requiresHazmatCert: false,
      requiresFSSAI: false,
      status: 'ACTIVE',
      lastUpdated: '2026-08-22',
    },
    {
      id: 'HS-003',
      hsCode: '8708.29',
      commodityName: 'Motor Vehicle Body Components & Accessories',
      category: 'Automotive & Heavy Industry',
      basicCustomsDutyPct: 15.0,
      igstPct: 28,
      riskTier: 'LOW',
      requiresHazmatCert: false,
      requiresFSSAI: false,
      status: 'ACTIVE',
      lastUpdated: '2026-08-18',
    },
    {
      id: 'HS-004',
      hsCode: '2905.11',
      commodityName: 'Methanol (Methyl Alcohol) Industrial Grade',
      category: 'Chemicals & Hazardous Cargo',
      basicCustomsDutyPct: 5.0,
      igstPct: 18,
      riskTier: 'HIGH',
      requiresHazmatCert: true,
      requiresFSSAI: false,
      status: 'RESTRICTED',
      lastUpdated: '2026-08-24',
    },
    {
      id: 'HS-005',
      hsCode: '0901.21',
      commodityName: 'Roasted Coffee Beans (Non-Decaffeinated)',
      category: 'Agri & Food Commodities',
      basicCustomsDutyPct: 100.0,
      igstPct: 5,
      riskTier: 'MEDIUM',
      requiresHazmatCert: false,
      requiresFSSAI: true,
      status: 'ACTIVE',
      lastUpdated: '2026-08-15',
    },
    {
      id: 'HS-006',
      hsCode: '9306.90',
      commodityName: 'Ammunition & Kinetic Ordnance Defense Items',
      category: 'Defense / Controlled Arms',
      basicCustomsDutyPct: 0.0,
      igstPct: 28,
      riskTier: 'HIGH',
      requiresHazmatCert: true,
      requiresFSSAI: false,
      status: 'PROHIBITED',
      lastUpdated: '2026-08-25',
    }
  ]);

  // Sanctions List
  const [sanctionsList] = useState<SanctionEntity[]>([
    {
      id: 'SNC-891',
      entityName: 'Al-Baraka Marine Shipping LLC',
      country: 'Iran / UAE Transshipment',
      listSource: 'OFAC SDN',
      riskScore: 99,
      status: 'BLOCKED',
      matchReason: 'Vessel AIS evasion & prohibited maritime crude transfers',
    },
    {
      id: 'SNC-742',
      entityName: 'Vostok Tech Heavy Equipment JSC',
      country: 'Russian Federation',
      listSource: 'EU Restrictive',
      riskScore: 88,
      status: 'FLAGGED_FOR_REVIEW',
      matchReason: 'Dual-use industrial electronic components restriction',
    },
    {
      id: 'SNC-603',
      entityName: 'Choson Maritime Transport Co.',
      country: 'North Korea (DPRK)',
      listSource: 'UN Sanctions',
      riskScore: 100,
      status: 'BLOCKED',
      matchReason: 'UN Security Council comprehensive embargo compliance',
    },
    {
      id: 'SNC-519',
      entityName: 'Apex Star Cargo Logistics FZE',
      country: 'Panama Flagged Carrier',
      listSource: 'DGFT India',
      riskScore: 75,
      status: 'FLAGGED_FOR_REVIEW',
      matchReason: 'Pending export declaration audit & customs penalty default',
    }
  ]);

  // Matrix Configuration
  const [autoSanctionScreening, setAutoSanctionScreening] = useState(true);
  const [highRiskThresholdValue, setHighRiskThresholdValue] = useState(5000000);
  const [mandatoryHazmatInspection, setMandatoryHazmatInspection] = useState(true);
  const [customsToleranceMargin, setCustomsToleranceMargin] = useState(5);

  // New Rule Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<HSCodeRule>>({
    hsCode: '',
    commodityName: '',
    category: 'Electronics & Electricals',
    basicCustomsDutyPct: 7.5,
    igstPct: 18,
    riskTier: 'LOW',
    requiresHazmatCert: false,
    requiresFSSAI: false,
    status: 'ACTIVE',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.hsCode || !newRule.commodityName) {
      showToast('Please enter both HS Code and Commodity Name.');
      return;
    }

    const created: HSCodeRule = {
      id: `HS-${String(hsRules.length + 1).padStart(3, '0')}`,
      hsCode: newRule.hsCode,
      commodityName: newRule.commodityName,
      category: newRule.category || 'General Cargo',
      basicCustomsDutyPct: newRule.basicCustomsDutyPct || 0,
      igstPct: newRule.igstPct || 18,
      riskTier: newRule.riskTier || 'LOW',
      requiresHazmatCert: !!newRule.requiresHazmatCert,
      requiresFSSAI: !!newRule.requiresFSSAI,
      status: newRule.status || 'ACTIVE',
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    setHsRules([created, ...hsRules]);
    setIsModalOpen(false);
    showToast(`HS Code rule ${created.hsCode} saved and applied to tariff risk engine.`);
  };

  const handleDeleteRule = (id: string) => {
    setHsRules((hsRules || []).filter(r => r && r.id !== id));
    showToast('HS Code classification rule removed.');
  };

  const filteredHsRules = (hsRules || []).filter(rule => {
    if (!rule) return false;
    const matchesSearch =
      (rule.hsCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rule.commodityName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rule.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || rule.riskTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 shadow-sm">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                COMPLIANCE & RISK GOVERNANCE
              </span>
              <span className="text-xs text-slate-400 font-bold">• Customs Tariff Act 2026</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">
              Risk & Customs Clearance Configuration
            </h2>
            <p className="text-xs text-slate-500">
              Manage HS Code duty schedules, sanctioned entity screening, hazardous goods compliance, and inspection thresholds.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-red-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add HS Code Rule</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('hs-rules')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'hs-rules'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>HS Code Duty & Compliance Rules ({hsRules.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sanctions')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'sanctions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4 text-red-400" />
          <span>Sanction Screening & Embargoes ({sanctionsList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('risk-matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'risk-matrix'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Inspection & Threshold Matrix</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ml-benchmark')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'ml-benchmark'
              ? 'bg-indigo-900 text-white shadow-sm'
              : 'text-indigo-600 hover:bg-indigo-50 font-bold'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>ML vs Rule Pricing Benchmark</span>
        </button>
      </div>

      {/* SUB-TAB 1: HS CODE RULES */}
      {activeSubTab === 'hs-rules' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Harmonized System (HS) Duty & Clearance Schedules
              </h3>
              <p className="text-xs text-slate-500">
                Applied automatically when shippers specify cargo items during quotation generation
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search HS code, commodity..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-red-500"
              >
                <option value="ALL">All Risk Tiers</option>
                <option value="LOW">Low Risk Tier</option>
                <option value="MEDIUM">Medium Risk Tier</option>
                <option value="HIGH">High Risk Tier</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
                  <th className="p-3.5 pl-4">HS Code</th>
                  <th className="p-3.5">Commodity Description</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">BCD Duty</th>
                  <th className="p-3.5">IGST</th>
                  <th className="p-3.5">Risk Tier</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredHsRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="p-3.5 pl-4 font-mono font-black text-red-600">{rule.hsCode}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{rule.commodityName}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        {rule.requiresHazmatCert && (
                          <span className="text-amber-600 font-bold">• Hazmat IMO Cert Req</span>
                        )}
                        {rule.requiresFSSAI && (
                          <span className="text-blue-600 font-bold">• FSSAI Food Compliance</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{rule.category}</td>
                    <td className="p-3.5 font-extrabold text-slate-900">{rule.basicCustomsDutyPct}%</td>
                    <td className="p-3.5 font-bold text-slate-700">{rule.igstPct}%</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        rule.riskTier === 'HIGH'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : rule.riskTier === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {rule.riskTier} RISK
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        rule.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : rule.status === 'RESTRICTED'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {rule.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-4 text-right">
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SANCTIONS LIST */}
      {activeSubTab === 'sanctions' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Restricted Parties, Sanctions & Anti-Smuggling Watchlist
              </h3>
              <p className="text-xs text-slate-500">
                Automated matching against OFAC, UN Security Council and Indian DGFT restricted manifests
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
              Live Screening: ON
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sanctionsList.map((item) => (
              <div key={item.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                    <span className="font-black text-sm text-slate-900">{item.entityName}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    item.status === 'BLOCKED'
                      ? 'bg-red-600 text-white'
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Country / Flag</span>
                    <span className="font-bold text-slate-800">{item.country}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">List Authority</span>
                    <span className="font-bold text-red-700">{item.listSource}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 font-medium">
                  <span className="font-bold text-slate-900">Reason:</span> {item.matchReason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RISK MATRIX */}
      {activeSubTab === 'risk-matrix' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Automated Cargo Risk & Inspection Thresholds
            </h3>
            <p className="text-xs text-slate-500">
              Configure business rules that trigger mandatory customs physical inspections and tariff security deposits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase">Automatic Sanction Screening</h4>
                  <p className="text-[11px] text-slate-500">Verify shipper company names & consignees against OFAC/DGFT</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoSanctionScreening}
                  onChange={(e) => setAutoSanctionScreening(e.target.checked)}
                  className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase">Mandatory Hazmat IMO Pre-Audit</h4>
                  <p className="text-[11px] text-slate-500">Require MSDS document upload before quote confirmation</p>
                </div>
                <input
                  type="checkbox"
                  checked={mandatoryHazmatInspection}
                  onChange={(e) => setMandatoryHazmatInspection(e.target.checked)}
                  className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-extrabold text-slate-900 uppercase">High Cargo Value Inspection Trigger</label>
                  <span className="font-mono text-xs font-black text-red-600">₹{(highRiskThresholdValue).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={1000000}
                  max={20000000}
                  step={500000}
                  value={highRiskThresholdValue}
                  onChange={(e) => setHighRiskThresholdValue(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Shipments exceeding this valuation are automatically tagged for 100% physical examination.
                </p>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-extrabold text-slate-900 uppercase">Customs Valuation Tolerance Buffer</label>
                  <span className="font-mono text-xs font-black text-red-600">±{customsToleranceMargin}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  value={customsToleranceMargin}
                  onChange={(e) => setCustomsToleranceMargin(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Acceptable discrepancy between declared value and benchmark master tariff index.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={() => showToast('Risk Matrix & Clearance rules updated successfully!')}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
            >
              Save Risk Parameters
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ML VS. RULE PRICING BENCHMARK */}
      {activeSubTab === 'ml-benchmark' && (
        <div className="space-y-4">
          <MLPricingComparisonPanel
            ruleBasedPriceInr={88500}
            readOnly={false}
          />
        </div>
      )}

      {/* Add HS Code Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Add New HS Code Classification</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">HS Code (6-8 Digits)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8471.30"
                    value={newRule.hsCode}
                    onChange={(e) => setNewRule({ ...newRule, hsCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">Risk Tier</label>
                  <select
                    value={newRule.riskTier}
                    onChange={(e) => setNewRule({ ...newRule, riskTier: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">Commodity Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Portable automatic data processing machines"
                  value={newRule.commodityName}
                  onChange={(e) => setNewRule({ ...newRule, commodityName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">BCD Duty (%)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={newRule.basicCustomsDutyPct}
                    onChange={(e) => setNewRule({ ...newRule, basicCustomsDutyPct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">IGST (%)</label>
                  <input
                    type="number"
                    min={0}
                    value={newRule.igstPct}
                    onChange={(e) => setNewRule({ ...newRule, igstPct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRule.requiresHazmatCert}
                    onChange={(e) => setNewRule({ ...newRule, requiresHazmatCert: e.target.checked })}
                    className="accent-red-600 rounded"
                  />
                  <span>Requires IMO Hazmat Cert</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRule.requiresFSSAI}
                    onChange={(e) => setNewRule({ ...newRule, requiresFSSAI: e.target.checked })}
                    className="accent-red-600 rounded"
                  />
                  <span>Requires FSSAI Clearance</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
                >
                  Save HS Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
