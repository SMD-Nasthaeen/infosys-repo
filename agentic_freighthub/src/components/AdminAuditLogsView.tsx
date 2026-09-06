import React, { useState } from 'react';
import {
  FileText,
  Shield,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Lock,
  User,
  ArrowRight,
  Code,
  Check
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  actorRole: 'ADMIN' | 'BUSINESS' | 'BROKER' | 'SYSTEM';
  actionType: 'TARIFF_OVERRIDE' | 'USER_PROVISIONED' | 'QUOTE_STATUS_CHANGE' | 'MASTER_DATA_EDIT' | 'RISK_RULE_UPDATED' | 'SECURITY_LOGIN';
  resourceTarget: string;
  changeSummary: string;
  ipAddress: string;
  status: 'SUCCESS' | 'DENIED' | 'FLAGGED';
}

export const AdminAuditLogsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [logs] = useState<AuditLogEntry[]>([
    {
      id: 'AUD-9941',
      timestamp: '2026-08-26 10:24:18',
      actorName: 'System Administrator Root',
      actorEmail: 'admin@freighthub.com',
      actorRole: 'ADMIN',
      actionType: 'TARIFF_OVERRIDE',
      resourceTarget: 'Tariff Matrix: Ocean FCL 20GP Base Rate',
      changeSummary: 'Base FCL rate updated from ₹120,000 to ₹125,000 (+4.1%).',
      ipAddress: '103.24.88.19 (Mumbai, IN)',
      status: 'SUCCESS',
    },
    {
      id: 'AUD-9940',
      timestamp: '2026-08-26 09:55:02',
      actorName: 'Commercial Pricing Desk',
      actorEmail: 'business@freighthub.com',
      actorRole: 'BUSINESS',
      actionType: 'QUOTE_STATUS_CHANGE',
      resourceTarget: 'Quote QT-2026-0091',
      changeSummary: 'Approved commercial quote with 12.5% target sales margin.',
      ipAddress: '182.72.101.44 (Chennai, IN)',
      status: 'SUCCESS',
    },
    {
      id: 'AUD-9939',
      timestamp: '2026-08-26 09:30:11',
      actorName: 'System Administrator Root',
      actorEmail: 'admin@freighthub.com',
      actorRole: 'ADMIN',
      actionType: 'USER_PROVISIONED',
      resourceTarget: 'User: Vikram Singh (Broker)',
      changeSummary: 'Generated new Freight Broker account with port clearance privileges.',
      ipAddress: '103.24.88.19 (Mumbai, IN)',
      status: 'SUCCESS',
    },
    {
      id: 'AUD-9938',
      timestamp: '2026-08-26 08:45:33',
      actorName: 'System Automated Engine',
      actorEmail: 'cron@freighthub.internal',
      actorRole: 'SYSTEM',
      actionType: 'MASTER_DATA_EDIT',
      resourceTarget: 'Exchange Rates Collection',
      changeSummary: 'Synchronized daily currency benchmark USD/INR: 87.42, EUR/INR: 95.10.',
      ipAddress: '10.0.4.12 (Internal VPC)',
      status: 'SUCCESS',
    },
    {
      id: 'AUD-9937',
      timestamp: '2026-08-26 07:15:20',
      actorName: 'System Administrator Root',
      actorEmail: 'admin@freighthub.com',
      actorRole: 'ADMIN',
      actionType: 'RISK_RULE_UPDATED',
      resourceTarget: 'Customs Duty HS Code 8504.40',
      changeSummary: 'Adjusted Basic Customs Duty from 10% to 7.5% per Union Budget Gazette.',
      ipAddress: '103.24.88.19 (Mumbai, IN)',
      status: 'SUCCESS',
    },
    {
      id: 'AUD-9936',
      timestamp: '2026-08-25 22:10:04',
      actorName: 'Unknown Shipper Guest',
      actorEmail: 'guest.shipper@unknown.org',
      actorRole: 'BROKER',
      actionType: 'SECURITY_LOGIN',
      resourceTarget: 'Admin Portal Access Attempt',
      changeSummary: 'Invalid credential attempt for administrative console rejected by RBAC guard.',
      ipAddress: '45.133.1.80 (Frankfurt, DE)',
      status: 'DENIED',
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportCSV = () => {
    showToast('Audit log records exported to CSV format.');
  };

  const filteredLogs = (logs || []).filter(log => {
    if (!log) return false;
    const term = (searchTerm || '').trim().toLowerCase();
    const matchesSearch =
      !term ||
      (log.id || '').toLowerCase().includes(term) ||
      (log.actorName || '').toLowerCase().includes(term) ||
      (log.actorEmail || '').toLowerCase().includes(term) ||
      (log.resourceTarget || '').toLowerCase().includes(term) ||
      (log.changeSummary || '').toLowerCase().includes(term);
    const matchesRole = roleFilter === 'ALL' || log.actorRole === roleFilter;
    const matchesAction = actionFilter === 'ALL' || log.actionType === actionFilter;
    return matchesSearch && matchesRole && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                COMPLIANCE & SYSTEM AUDIT TRAIL
              </span>
              <span className="text-xs text-slate-400 font-bold">• Immutable Cryptographic Ledger</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">
              System Audit Logs & Governance History
            </h2>
            <p className="text-xs text-slate-500">
              Track tariff adjustments, administrative account provisions, quote approvals, and authorization events.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail by actor, IP, quote or resource..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">System Admin</option>
            <option value="BUSINESS">Business Desk</option>
            <option value="BROKER">Freight Broker</option>
            <option value="SYSTEM">Automated Cron</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="TARIFF_OVERRIDE">Tariff Overrides</option>
            <option value="USER_PROVISIONED">User Provisioning</option>
            <option value="QUOTE_STATUS_CHANGE">Quote Approvals</option>
            <option value="MASTER_DATA_EDIT">Master Data Edits</option>
            <option value="SECURITY_LOGIN">Security / Auth</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
                <th className="p-3.5 pl-4">Timestamp / Event ID</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Action Type</th>
                <th className="p-3.5">Target Resource</th>
                <th className="p-3.5">Change Summary</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5 pr-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-purple-50/30 transition-colors">
                  <td className="p-3.5 pl-4">
                    <div className="font-mono font-bold text-slate-900">{log.timestamp}</div>
                    <div className="font-mono text-[10px] text-purple-700 font-black">{log.id}</div>
                  </td>

                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{log.actorName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.actorEmail}</div>
                    <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-black bg-purple-100 text-purple-800">
                      {log.actorRole}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                      log.status === 'DENIED'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {log.actionType.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="p-3.5 font-bold text-slate-800 max-w-[180px] truncate">
                    {log.resourceTarget}
                  </td>

                  <td className="p-3.5 text-slate-600 max-w-[280px]">
                    {log.changeSummary}
                  </td>

                  <td className="p-3.5 font-mono text-[11px] text-slate-500">
                    {log.ipAddress}
                  </td>

                  <td className="p-3.5 pr-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 bg-slate-100 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-colors text-slate-600 cursor-pointer"
                      title="Inspect Log Entry"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Audit Event Details</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedLog.id} • {selectedLog.timestamp}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Actor Credentials</span>
                <div className="font-bold text-slate-900">{selectedLog.actorName} ({selectedLog.actorEmail})</div>
                <div className="text-slate-600 font-mono text-[11px]">Role: {selectedLog.actorRole} • IP: {selectedLog.ipAddress}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Action & Target</span>
                <div className="font-bold text-purple-900">{selectedLog.actionType}</div>
                <div className="text-slate-700">{selectedLog.resourceTarget}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Change Description</span>
                <p className="text-slate-800 font-medium leading-relaxed">{selectedLog.changeSummary}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
