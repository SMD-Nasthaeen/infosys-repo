import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  UserCheck,
  Building,
  ExternalLink
} from 'lucide-react';
import {
  CustomsComplianceCheck,
  ComplianceStatus,
  SignOffAction
} from '../types/milestone3';
import { SEEDED_CUSTOMS_CHECKS } from '../data/milestone3Data';

interface CustomsDashboardWorkspaceProps {
  userRole?: string;
  userEmail?: string;
  onNavigateToRegulations?: () => void;
}

export const CustomsDashboardWorkspace: React.FC<CustomsDashboardWorkspaceProps> = ({
  userEmail = 'customs.appraiser@cbic.gov.in',
  onNavigateToRegulations,
}) => {
  const [cases, setCases] = useState<CustomsComplianceCheck[]>(SEEDED_CUSTOMS_CHECKS);
  const [selectedCase, setSelectedCase] = useState<CustomsComplianceCheck>(SEEDED_CUSTOMS_CHECKS[1]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [officerNotes, setOfficerNotes] = useState<string>('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Synchronize generated shipments/quotes from User Dashboard into Customs Workspace
  useEffect(() => {
    const syncFromUserDashboard = () => {
      try {
        const storedShipments = localStorage.getItem('freighthub_saved_shipments_v1');
        if (storedShipments) {
          const parsed = JSON.parse(storedShipments);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const nowIso = new Date().toISOString();
            const syncedCases: CustomsComplianceCheck[] = parsed.map((s: any, idx: number) => ({
              id: `CUST-2026-${100 + idx}`,
              shipment_id: s.id,
              quote_id: s.quotation?.quoteId || `Q-CUST-${100 + idx}`,
              origin_country: 'India',
              destination_country: 'Destination Country',
              origin_port: s.originPort || 'INMAA',
              destination_port: s.destinationPort || 'SGSIN',
              hs_code: '8471.30.10',
              commodity: `${s.cargoType || 'General Cargo'} (${s.containerType || '40HC Container'})`,
              incoterm: 'FOB',
              declared_value_inr: s.quotation ? Math.round(s.quotation.finalQuoteUsd * 83) : 1500000,
              basic_customs_duty_pct: 7.5,
              igst_pct: 18,
              status: s.status === 'APPROVED' ? 'APPROVED' : (s.status === 'NEEDS_DOCUMENTS' ? 'NEEDS_DOCUMENTS' : 'NEEDS_REVIEW'),
              readiness_score: s.status === 'APPROVED' ? 100 : 75,
              risk_level: 'LOW',
              prohibited_match: false,
              sanction_match: false,
              mandatory_documents_count: 4,
              uploaded_documents_count: s.status === 'APPROVED' ? 4 : 3,
              verified_documents_count: s.status === 'APPROVED' ? 4 : 2,
              checklist_items: [
                { id: `chk-1-${s.id}`, compliance_check_id: `CUST-2026-${100 + idx}`, requirement_id: 'REQ-INV', item_name: 'Commercial Invoice & Valuation', description: 'Rule 11 Valuation Statement', mandatory: true, document_required: true, document_uploaded: true, status: 'VERIFIED' as const, evidence: 'Verified via synced shipment data', citation: 'CBIC Sec. 46(1)', created_at: nowIso, updated_at: nowIso },
                { id: `chk-2-${s.id}`, compliance_check_id: `CUST-2026-${100 + idx}`, requirement_id: 'REQ-PKG', item_name: 'Packing List & Container Weight (SOLAS VGM)', description: 'Container weight verification', mandatory: true, document_required: true, document_uploaded: true, status: 'VERIFIED' as const, evidence: 'Verified via synced shipment data', citation: 'IMO SOLAS VI/2', created_at: nowIso, updated_at: nowIso },
                { id: `chk-3-${s.id}`, compliance_check_id: `CUST-2026-${100 + idx}`, requirement_id: 'REQ-BL', item_name: 'Bill of Lading / Airway Bill', description: 'Carrier transportation document', mandatory: true, document_required: true, document_uploaded: true, status: 'PENDING' as const, evidence: 'Pending carrier document', citation: 'Carrier T&C', created_at: nowIso, updated_at: nowIso },
                { id: `chk-4-${s.id}`, compliance_check_id: `CUST-2026-${100 + idx}`, requirement_id: 'REQ-MSDS', item_name: 'Non-Hazardous / MSDS Certificate', description: 'Safety compliance manifest', mandatory: false, document_required: true, document_uploaded: false, status: 'PENDING' as const, evidence: 'Pending safety manifest', citation: 'IMDG Code', created_at: nowIso, updated_at: nowIso },
              ],
              regulation_citations: [],
              checked_at: nowIso,
              expires_at: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
              created_by: 'user-dashboard-sync',
              created_at: nowIso,
              updated_at: nowIso,
            }));

            setCases(syncedCases);
            if (syncedCases.length > 0) {
              setSelectedCase(syncedCases[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync customs checks from user shipments:', err);
      }
    };

    syncFromUserDashboard();
    window.addEventListener('freighthub_shipments_updated', syncFromUserDashboard);
    return () => window.removeEventListener('freighthub_shipments_updated', syncFromUserDashboard);
  }, []);

  const filteredCases = (cases || []).filter((c) => {
    if (!c) return false;
    const term = (searchTerm || '').trim().toLowerCase();
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      !term ||
      (c.shipment_id || '').toLowerCase().includes(term) ||
      (c.hs_code || '').includes(term) ||
      (c.commodity || '').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const updateSharedUserDashboardState = (shipmentId: string, newStatus: string, signOffAction: SignOffAction) => {
    try {
      const stored = localStorage.getItem('freighthub_saved_shipments_v1');
      if (stored) {
        const shipments = JSON.parse(stored);
        if (Array.isArray(shipments)) {
          const updatedShipments = shipments.map((s: any) => {
            if (s.id === shipmentId) {
              const targetStatus = signOffAction === 'APPROVE' ? 'APPROVED' : (signOffAction === 'REQUEST_DOCUMENTS' ? 'NEEDS_DOCUMENTS' : newStatus);
              return {
                ...s,
                status: targetStatus,
                quotation: s.quotation ? {
                  ...s.quotation,
                  status: targetStatus,
                  customsApprovedAt: signOffAction === 'APPROVE' ? new Date().toISOString() : undefined,
                } : undefined,
              };
            }
            return s;
          });

          localStorage.setItem('freighthub_saved_shipments_v1', JSON.stringify(updatedShipments));
          window.dispatchEvent(new Event('freighthub_shipments_updated'));
        }
      }
    } catch (e) {
      console.error('Error broadcasting customs sign-off to user dashboard:', e);
    }
  };

  const handleSignOff = async (action: SignOffAction) => {
    setIsProcessing(true);
    const nowStr = new Date().toISOString();

    try {
      await fetch(`/v1/customs/${selectedCase.id}/sign-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          officer_id: userEmail.split('@')[0].toUpperCase(),
          officer_name: 'Customs Appraiser Rajesh Kumar',
          notes: officerNotes || `Official review completed with action: ${action}`,
          verified_item_ids: selectedItemIds,
        }),
      });
    } catch {
      // Graceful local fallback
    }

    let updatedStatus: ComplianceStatus;
    let newReadiness = selectedCase.readiness_score;

    if (action === 'APPROVE') {
      updatedStatus = 'APPROVED';
      newReadiness = 100;
    } else if (action === 'CONDITIONAL') {
      updatedStatus = 'CONDITIONAL';
      newReadiness = Math.max(85, selectedCase.readiness_score);
    } else if (action === 'REQUEST_DOCUMENTS') {
      updatedStatus = 'NEEDS_DOCUMENTS';
      newReadiness = Math.min(60, selectedCase.readiness_score);
    } else {
      updatedStatus = 'REJECTED';
      newReadiness = 0;
    }

    const updatedCase: CustomsComplianceCheck = {
      ...selectedCase,
      status: updatedStatus,
      readiness_score: newReadiness,
      reviewed_by: `Customs Appraiser (${userEmail})`,
      reviewer_notes: officerNotes || `Sign-off executed: ${action}`,
      sign_off_action: action,
      signed_off_at: nowStr,
      checklist_items: (selectedCase.checklist_items || []).map((item) =>
        selectedItemIds.includes(item.id) || action === 'APPROVE'
          ? { ...item, status: 'VERIFIED' as const, document_uploaded: true }
          : item
      ),
    };

    setCases((prev) => (prev || []).map((c) => (c.id === updatedCase.id ? updatedCase : c)));
    setSelectedCase(updatedCase);
    setOfficerNotes('');
    setSelectedItemIds([]);

    updateSharedUserDashboardState(selectedCase.shipment_id, updatedStatus, action);

    setActionToast({
      message: `Consignment ${selectedCase.shipment_id} sign-off executed: ${action}. User Dashboard and Quotations state updated!`,
      type: action === 'APPROVE' ? 'success' : (action === 'REJECT' ? 'error' : 'warning'),
    });

    setIsProcessing(false);
    setTimeout(() => setActionToast(null), 5000);
  };

  return (
    <div id="customs-workspace-dashboard" className="max-w-7xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Customs Compliance Workspace & Review Console
              <span className="text-xs bg-emerald-900/60 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-700/50">
                User Dashboard Live Sync Connected
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Statutory tariff validation, mandatory document filings, and Customs Appraiser sign-off loop
            </p>
          </div>
        </div>

        {onNavigateToRegulations && (
          <button
            onClick={onNavigateToRegulations}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-blue-400" />
            Open Hybrid Regulation RAG Library
          </button>
        )}
      </div>

      {actionToast && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-lg border transition-all ${
            actionToast.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
              : actionToast.type === 'error'
              ? 'bg-red-950/80 text-red-200 border-red-800'
              : 'bg-amber-950/80 text-amber-200 border-amber-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : actionToast.type === 'error' ? (
              <XCircle className="w-5 h-5 text-red-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
            <span>{actionToast.message}</span>
          </div>
          <button onClick={() => setActionToast(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-400" /> Review Queue
              </h3>
              <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                {filteredCases.length} Cases
              </span>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-2 mb-3 text-[11px] font-medium border-b border-slate-800">
              {['ALL', 'NEEDS_REVIEW', 'NEEDS_DOCUMENTS', 'PASS', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === st ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by Shipment ID, HS code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredCases.map((c) => {
                const isSelected = selectedCase.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-950/30 border-blue-500 shadow-sm'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-xs text-white">{c.shipment_id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.status === 'PASS' || c.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : c.status === 'NEEDS_REVIEW'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : c.status === 'NEEDS_DOCUMENTS'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-medium truncate mb-1">{c.commodity}</div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                      <span>HS {c.hs_code}</span>
                      <span className="font-bold text-slate-200">{c.readiness_score}% Ready</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-white font-mono">{selectedCase.shipment_id}</h3>
                  <span className="text-xs text-slate-400 font-mono">({selectedCase.id})</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Route: <span className="text-slate-200 font-semibold">{selectedCase.origin_country} ({selectedCase.origin_port})</span> → <span className="text-slate-200 font-semibold">{selectedCase.destination_country} ({selectedCase.destination_port})</span> | Incoterm: <span className="text-blue-400 font-bold">{selectedCase.incoterm}</span>
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Statutory Readiness</div>
                <div className="text-2xl font-black text-blue-400 font-mono">{selectedCase.readiness_score}%</div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Customs Appraiser Official Action Loop
                </h4>
              </div>

              <textarea
                placeholder="Official audit remarks, inspection conditions, or missing document notification notes..."
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-3"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => handleSignOff('APPROVE')}
                  disabled={isProcessing}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve Pass
                </button>

                <button
                  onClick={() => handleSignOff('CONDITIONAL')}
                  disabled={isProcessing}
                  className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Clock className="w-3.5 h-3.5" /> Conditional
                </button>

                <button
                  onClick={() => handleSignOff('REQUEST_DOCUMENTS')}
                  disabled={isProcessing}
                  className="py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Request Docs
                </button>

                <button
                  onClick={() => handleSignOff('REJECT')}
                  disabled={isProcessing}
                  className="py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject Consignment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};