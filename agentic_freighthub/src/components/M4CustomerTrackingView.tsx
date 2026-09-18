import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Package,
  Ship,
  Plane,
  Truck,
  Zap,
  Calendar,
  Circle,
  XCircle,
  AlertTriangle,
  Search,
  Radar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UserRole, SavedQuotation } from '../types';

interface TrackingTimelineStep {
  step: string;
  label: string;
  description?: string;
  status: string;
  timestamp: string | null;
  remarks?: string | null;
  missingInfo?: string[];
  bookingRef?: string | null;
}

interface TrackingShipment {
  quoteId: string;
  originCode: string;
  destinationCode: string;
  transportMode: string;
  tariffAmount: number;
  currency: string;
  companyName: string;
  companyId: string;
  currentStage: string;
  stageStatus: string;
  timeline: TrackingTimelineStep[];
  createdAt: string;
  updatedAt: string;
}

interface M4CustomerTrackingViewProps {
  userEmail: string;
  userRole?: UserRole;
  quotations?: SavedQuotation[];
}

const REFRESH_INTERVAL_MS = 30000;

const getTransportIcon = (mode: string) => {
  switch ((mode || '').toLowerCase()) {
    case 'ocean': return <Ship className="w-3.5 h-3.5" />;
    case 'air': return <Plane className="w-3.5 h-3.5" />;
    case 'ground': return <Truck className="w-3.5 h-3.5" />;
    case 'express': return <Zap className="w-3.5 h-3.5" />;
    default: return <Package className="w-3.5 h-3.5" />;
  }
};

const getTransportLabel = (mode: string): string => {
  switch ((mode || '').toLowerCase()) {
    case 'ocean': return 'OCEAN';
    case 'air': return 'AIR';
    case 'ground': return 'GROUND';
    case 'express': return 'EXPRESS';
    default: return (mode || 'FREIGHT').toUpperCase();
  }
};

const getStageStatusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED': return 'bg-emerald-500';
    case 'CURRENT':
    case 'IN_PROGRESS':
    case 'WAITING': return 'bg-blue-500';
    case 'ACTION_REQUIRED':
    case 'INFO_REQUESTED': return 'bg-amber-500';
    case 'REJECTED': return 'bg-red-500';
    case 'CANCELLED': return 'bg-red-400';
    default: return 'bg-slate-300';
  }
};

const getStatusBadge = (stageStatus: string, currentStage: string): { color: string; label: string } => {
  const stageLabel = currentStage
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  switch (stageStatus) {
    case 'COMPLETED':
      return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: stageLabel };
    case 'CURRENT':
    case 'IN_PROGRESS':
      return { color: 'bg-blue-100 text-blue-700 border-blue-200', label: stageLabel };
    case 'ACTION_REQUIRED':
      return { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Action Required' };
    case 'REJECTED':
      return { color: 'bg-red-100 text-red-700 border-red-200', label: 'Rejected' };
    case 'CANCELLED':
      return { color: 'bg-red-50 text-red-500 border-red-200', label: 'Cancelled' };
    default:
      return { color: 'bg-slate-100 text-slate-500 border-slate-200', label: stageLabel };
  }
};

const safeFormatTimestamp = (ts: string | null | undefined): string => {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ' \u2022 ' + d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export const M4CustomerTrackingView: React.FC<M4CustomerTrackingViewProps> = ({
  userEmail,
  userRole,
  quotations = [],
}) => {
  const [shipments, setShipments] = useState<TrackingShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTrackingData = useCallback(async () => {
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';

      // Pass client-side quote IDs so backend can include unselected quotes
      const quoteIds = quotations.map((q) => q.id);
      const queryParam = quoteIds.length > 0 ? `?quoteIds=${encodeURIComponent(JSON.stringify(quoteIds))}` : '';

      const res = await fetch(`/api/tracking${queryParam}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        if (res.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (res.status === 403) {
          setError('You do not have permission to access tracking data.');
        } else {
          setError((errBody && errBody.error) || 'Unable to load tracking data. Please try again.');
        }
        return;
      }

      const result = await res.json().catch(() => null);
      if (result && result.success && Array.isArray(result.data)) {
        setShipments(result.data);
        setError('');
      } else {
        setError((result && result.error) || 'Unable to load tracking data. Please try again.');
      }
    } catch {
      setError('Unable to connect to server. Please check your connection and try again.');
    }
  }, [quotations]);

  // Merge backend shipments with client-side-only quotes
  const mergedShipments = useCallback((): TrackingShipment[] => {
    const backendQuoteIds = new Set(shipments.map((s) => s.quoteId));
    const clientOnlyQuotes = quotations.filter((q) => !backendQuoteIds.has(q.id));

    const clientShipments: TrackingShipment[] = clientOnlyQuotes.map((q) => ({
      quoteId: q.id,
      originCode: q.originCode || '',
      destinationCode: q.destinationCode || '',
      transportMode: q.transportMode || '',
      tariffAmount: q.tariffAmount || 0,
      currency: q.currency || 'INR',
      companyName: q.companyName || 'FreightHub',
      companyId: q.companyId || '',
      currentStage: 'QUOTE_GENERATED',
      stageStatus: 'COMPLETED',
      timeline: [
        {
          step: 'QUOTE_GENERATED',
          label: 'Quote Generated',
          description: 'Your freight quotation has been generated.',
          status: 'COMPLETED',
          timestamp: q.createdAt || null,
        },
        {
          step: 'AGENT_REVIEW',
          label: 'Agent Review',
          description: 'Waiting for freight agent to review your quotation.',
          status: 'PENDING',
          timestamp: null,
        },
        {
          step: 'CUSTOMS_OFFICER_REVIEW',
          label: 'Customs Officer Review',
          description: 'Pending customs officer review.',
          status: 'PENDING',
          timestamp: null,
        },
        {
          step: 'BOOKED',
          label: 'Booked',
          description: 'Booking will be created after customs approval.',
          status: 'PENDING',
          timestamp: null,
        },
      ],
      createdAt: q.createdAt || new Date().toISOString(),
      updatedAt: q.createdAt || new Date().toISOString(),
    }));

    return [...shipments, ...clientShipments];
  }, [shipments, quotations]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTrackingData().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchTrackingData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchTrackingData();
    }, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchTrackingData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrackingData();
    setRefreshing(false);
  }, [fetchTrackingData]);

  const allShipments = mergedShipments();

  const filteredShipments = allShipments.filter((s) => {
    if (!searchQuery || !s) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.quoteId || '').toLowerCase().includes(q) ||
      (s.originCode || '').toLowerCase().includes(q) ||
      (s.destinationCode || '').toLowerCase().includes(q) ||
      (s.companyName || '').toLowerCase().includes(q)
    );
  });

  // Sort by most recent activity
  const sortedShipments = [...filteredShipments].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt).getTime();
    return dateB - dateA;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-500 font-medium">Loading tracking data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
            <Radar className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Shipment Tracking</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Track your freight quotation and booking process
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by quote ID, origin, destination, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        />
      </div>

      {/* Error */}
      {error ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Empty State */}
      {!error && sortedShipments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-700 mb-1">
            No Active Shipments
          </h3>
          <p className="text-xs text-slate-400 max-w-[280px]">
            Your active freight processes will appear here once you select a quotation.
          </p>
        </div>
      )}

      {/* Tracking Cards */}
      {sortedShipments.length > 0 && (
        <div className="space-y-3">
          {sortedShipments.map((shipment) => {
            if (!shipment) return null;
            const qid = shipment.quoteId || '';
            const isExpanded = expandedQuoteId === qid;
            const timeline = Array.isArray(shipment.timeline) ? shipment.timeline : [];
            const originCode = shipment.originCode || '---';
            const destCode = shipment.destinationCode || '---';
            const transportMode = shipment.transportMode || '';
            const companyName = shipment.companyName || 'FreightHub';
            const stageStatus = shipment.stageStatus || 'PENDING';
            const badge = getStatusBadge(stageStatus, shipment.currentStage || '');

            return (
              <div
                key={qid}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isExpanded
                    ? 'border-blue-400 shadow-md ring-1 ring-blue-500/10'
                    : 'border-slate-200 hover:border-blue-200 hover:shadow-sm'
                }`}
              >
                {/* Compact Card Header */}
                <button
                  onClick={() => setExpandedQuoteId(isExpanded ? null : qid)}
                  className="w-full text-left p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Route and company */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${getStageStatusColor(stageStatus)} flex items-center justify-center text-white shrink-0`}>
                        {stageStatus === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4.5 h-4.5" />
                        ) : stageStatus === 'REJECTED' ? (
                          <XCircle className="w-4.5 h-4.5" />
                        ) : stageStatus === 'ACTION_REQUIRED' ? (
                          <AlertTriangle className="w-4.5 h-4.5" />
                        ) : (
                          <Clock className="w-4.5 h-4.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-extrabold text-slate-900 truncate">{companyName}</h3>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{qid}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] font-extrabold text-slate-800">{originCode}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-[11px] font-extrabold text-slate-800">{destCode}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            {getTransportIcon(transportMode)}
                            {getTransportLabel(transportMode)}
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-700">
                            {shipment.currency} {(shipment.tariffAmount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status badge and expand icon */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {safeFormatTimestamp(shipment.updatedAt || shipment.createdAt)}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Timeline */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <div className="pt-4">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                        Tracking Timeline
                      </h4>
                      <div className="relative">
                        {timeline.map((step, idx) => {
                          if (!step) return null;
                          const isLast = idx === timeline.length - 1;
                          const stepStatus = (step.status || 'PENDING').toUpperCase();
                          const isCompleted = stepStatus === 'COMPLETED';
                          const isCurrent = stepStatus === 'IN_PROGRESS' || stepStatus === 'CURRENT' || stepStatus === 'WAITING';
                          const isRejected = stepStatus === 'REJECTED';
                          const isInfoRequired = stepStatus === 'INFO_REQUESTED';
                          const isPending = !isCompleted && !isCurrent && !isRejected && !isInfoRequired;

                          return (
                            <div key={step.step || idx} className="relative flex gap-3">
                              {/* Connector line */}
                              {!isLast && (
                                <div className={`absolute left-[11px] top-[28px] w-0.5 h-[calc(100%-8px)] ${
                                  isCompleted ? 'bg-emerald-400' : isRejected ? 'bg-red-300' : 'bg-slate-200'
                                }`} />
                              )}

                              {/* Status circle */}
                              <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                isCompleted ? 'bg-emerald-500 text-white' :
                                isRejected ? 'bg-red-500 text-white' :
                                isInfoRequired ? 'bg-amber-500 text-white' :
                                isCurrent ? 'bg-blue-500 text-white animate-pulse' :
                                'bg-slate-200 text-slate-400'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : isRejected ? (
                                  <XCircle className="w-3.5 h-3.5" />
                                ) : isInfoRequired ? (
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                ) : isCurrent ? (
                                  <Clock className="w-3.5 h-3.5" />
                                ) : (
                                  <Circle className="w-2.5 h-2.5" />
                                )}
                              </div>

                              {/* Content */}
                              <div className={`pb-5 flex-1 ${isLast ? 'pb-0' : ''}`}>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className={`text-[11px] font-extrabold ${
                                    isCompleted ? 'text-emerald-700' :
                                    isRejected ? 'text-red-700' :
                                    isInfoRequired ? 'text-amber-700' :
                                    isCurrent ? 'text-blue-700' :
                                    'text-slate-400'
                                  }`}>
                                    {step.label || 'Step'}
                                  </p>
                                  {isCurrent && (
                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 uppercase">
                                      {stepStatus === 'WAITING' ? 'Waiting' : 'In Progress'}
                                    </span>
                                  )}
                                  {isInfoRequired && (
                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 uppercase">
                                      Action Required
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 uppercase">
                                      Rejected
                                    </span>
                                  )}
                                </div>

                                {step.description ? (
                                  <p className="text-[10px] text-slate-400 mt-0.5">{step.description}</p>
                                ) : null}

                                {step.timestamp ? (
                                  <p className="text-[9px] text-slate-400 mt-0.5">
                                    <Calendar className="inline w-2.5 h-2.5 mr-0.5" />
                                    {safeFormatTimestamp(step.timestamp)}
                                  </p>
                                ) : null}

                                {step.remarks ? (
                                  <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                    <p className="text-[9px] text-slate-500 font-medium">{step.remarks}</p>
                                  </div>
                                ) : null}

                                {Array.isArray(step.missingInfo) && step.missingInfo.length > 0 && (
                                  <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200">
                                    <p className="text-[9px] text-amber-700 font-bold mb-0.5">Missing Information:</p>
                                    <ul className="list-disc list-inside">
                                      {step.missingInfo.map((info, i) => (
                                        <li key={i} className="text-[9px] text-amber-600">{info}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {step.bookingRef ? (
                                  <div className="mt-1.5 p-2 rounded-lg bg-blue-50 border border-blue-200">
                                    <p className="text-[9px] text-blue-600 font-bold">
                                      Booking Ref: {step.bookingRef}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
