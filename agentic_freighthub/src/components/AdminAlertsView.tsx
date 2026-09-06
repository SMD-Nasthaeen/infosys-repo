import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Check,
  X,
  ArrowRight,
  ShieldAlert,
  Flame,
  Zap,
  Ship,
  Eye
} from 'lucide-react';

interface SystemAlert {
  id: string;
  title: string;
  category: 'RATE_ANOMALY' | 'SANCTION_HIT' | 'PORT_DELAY' | 'EXPIRING_QUOTE' | 'SECURITY';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  sourceEntity: string;
  timestamp: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export const AdminAlertsView: React.FC = () => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: 'ALT-1082',
      title: 'Sudden Ocean Rate Surcharge Surge (+28%)',
      category: 'RATE_ANOMALY',
      severity: 'CRITICAL',
      description: 'Carrier spot rates on Mundra (INMUN) → Rotterdam (NLRTM) increased by 28% due to Red Sea transit surcharge adjustments.',
      sourceEntity: 'Carrier Rate Engine (MSC & Hapag)',
      timestamp: '14 mins ago (10:16)',
      status: 'ACTIVE',
    },
    {
      id: 'ALT-1081',
      title: 'Potential Sanctions Watchlist Entity Match',
      category: 'SANCTION_HIT',
      severity: 'CRITICAL',
      description: 'Customer quote generated for consignee matching OFAC secondary review watchlist. Flagged for administrative verification.',
      sourceEntity: 'Quote QT-2026-0094 (Vostok Tech)',
      timestamp: '42 mins ago (09:48)',
      status: 'ACTIVE',
    },
    {
      id: 'ALT-1080',
      title: 'Jebel Ali (AEJEA) Terminal Congestion Alert',
      category: 'PORT_DELAY',
      severity: 'WARNING',
      description: 'Average container dwell time increased from 42h to 78h at Terminal 2 due to crane maintenance operations.',
      sourceEntity: 'Port Telemetry Feed',
      timestamp: '2 hours ago',
      status: 'ACKNOWLEDGED',
    },
    {
      id: 'ALT-1079',
      title: 'Commercial High-Value Quote Awaiting Approval (> ₹1,000,000)',
      category: 'EXPIRING_QUOTE',
      severity: 'WARNING',
      description: 'Quote QT-2026-0092 (₹1,450,000) for 10x 40HC containers requires Admin/Broker dual-signature approval.',
      sourceEntity: 'Quotation Desk',
      timestamp: '3 hours ago',
      status: 'ACTIVE',
    },
    {
      id: 'ALT-1078',
      title: 'Daily FX Currency Feed Successfully Synchronized',
      category: 'SECURITY',
      severity: 'INFO',
      description: 'Central bank benchmark FX rates updated. USD/INR adjusted to 87.42; EUR/INR to 95.10.',
      sourceEntity: 'Forex Sync Service',
      timestamp: '5 hours ago',
      status: 'RESOLVED',
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a)));
    showToast(`Alert ${id} marked as Acknowledged.`);
  };

  const handleResolve = (id: string) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'RESOLVED' } : a)));
    showToast(`Alert ${id} resolved and archived.`);
  };

  const filteredAlerts = (alerts || []).filter(a => {
    if (!a) return false;
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  const activeCount = (alerts || []).filter(a => a && a.status === 'ACTIVE').length;
  const criticalCount = (alerts || []).filter(a => a && a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 shadow-sm relative">
            <Bell className="w-6 h-6" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                SYSTEM TELEMETRY ALERTS
              </span>
              <span className="text-xs text-slate-400 font-bold">• {activeCount} Active Issues</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">
              Operational Alerts & Exceptions Monitor
            </h2>
            <p className="text-xs text-slate-500">
              Immediate notifications for rate surges, high-value quotation bottlenecks, port dwell spikes, and sanction matches.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-red-50 text-red-700 rounded-xl text-xs font-black border border-red-200">
            {criticalCount} Critical
          </span>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-black border border-amber-200">
            {activeCount} Active
          </span>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-extrabold text-slate-600 uppercase mr-1">Status:</span>
          {['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'ALL'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-600 uppercase mr-1">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Alert Feed Cards */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-extrabold text-slate-900 text-base">No active alerts matching your filter</h3>
            <p className="text-xs text-slate-500">All systems operating within acceptable rate tolerances and SLAs.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-5 rounded-3xl border transition-all space-y-3 ${
                alert.severity === 'CRITICAL'
                  ? 'bg-red-50/40 border-red-200'
                  : alert.severity === 'WARNING'
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-600 text-white'
                      : alert.severity === 'WARNING'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-400">{alert.id}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-slate-500">{alert.sourceEntity}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{alert.timestamp}</span>
                </div>
              </div>

              <div>
                <h4 className="font-black text-sm text-slate-900">{alert.title}</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{alert.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    alert.status === 'ACTIVE'
                      ? 'bg-red-100 text-red-800'
                      : alert.status === 'ACKNOWLEDGED'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    STATUS: {alert.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {alert.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  )}

                  {alert.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
