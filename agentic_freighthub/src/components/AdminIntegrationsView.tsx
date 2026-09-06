import React, { useState } from 'react';
import {
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Server,
  Zap,
  Radio,
  Clock,
  ArrowRight,
  Check,
  Code,
  Sliders,
  Play,
  Settings,
  Database
} from 'lucide-react';

interface IntegrationConnector {
  id: string;
  name: string;
  category: 'TELEMETRY' | 'EXCHANGE_RATES' | 'CARRIER_API' | 'CUSTOMS_EDI' | 'WEATHER';
  provider: string;
  syncFrequencyMins: number;
  lastSyncTimestamp: string;
  status: 'ONLINE' | 'DEGRADED' | 'SYNCING' | 'OFFLINE';
  latencyMs: number;
  recordsSyncedToday: number;
  endpointUrl: string;
  authType: 'API_KEY' | 'OAUTH2' | 'EDIFACT' | 'MUTUAL_TLS';
}

export const AdminIntegrationsView: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [selectedConnectorPayload, setSelectedConnectorPayload] = useState<IntegrationConnector | null>(null);

  const [connectors, setConnectors] = useState<IntegrationConnector[]>([
    {
      id: 'INT-01',
      name: 'Global Satellite AIS Vessel Radar',
      category: 'TELEMETRY',
      provider: 'Spire Maritime & MarineTraffic Feed',
      syncFrequencyMins: 2,
      lastSyncTimestamp: '2 mins ago (10:28:14)',
      status: 'ONLINE',
      latencyMs: 142,
      recordsSyncedToday: 18450,
      endpointUrl: 'https://stream.ais-telemetry.freighthub.internal/v2/positions',
      authType: 'MUTUAL_TLS',
    },
    {
      id: 'INT-02',
      name: 'Central Bank & Forex FX Feed',
      category: 'EXCHANGE_RATES',
      provider: 'Reserve Bank of India & OpenExchangeRates',
      syncFrequencyMins: 15,
      lastSyncTimestamp: '4 mins ago (10:26:00)',
      status: 'ONLINE',
      latencyMs: 88,
      recordsSyncedToday: 2880,
      endpointUrl: 'https://api.forex-rates.freighthub.internal/daily/live',
      authType: 'API_KEY',
    },
    {
      id: 'INT-03',
      name: 'Ocean Carrier Spot Rate Feeds',
      category: 'CARRIER_API',
      provider: 'Maersk Spot, MSC Direct & Hapag-Lloyd API',
      syncFrequencyMins: 30,
      lastSyncTimestamp: '12 mins ago (10:18:00)',
      status: 'ONLINE',
      latencyMs: 310,
      recordsSyncedToday: 4120,
      endpointUrl: 'https://carriers.gateway.freighthub.internal/quotes/spot',
      authType: 'OAUTH2',
    },
    {
      id: 'INT-04',
      name: 'Indian Customs ICEGATE & PCS EDI',
      category: 'CUSTOMS_EDI',
      provider: 'Port Community System (PCS 1x) & ICEGATE',
      syncFrequencyMins: 5,
      lastSyncTimestamp: '1 min ago (10:29:12)',
      status: 'ONLINE',
      latencyMs: 220,
      recordsSyncedToday: 9640,
      endpointUrl: 'https://icegate.customs.gov.in/edi/301/manifest-stream',
      authType: 'EDIFACT',
    },
    {
      id: 'INT-05',
      name: 'Maritime Cyclone & Weather Stream',
      category: 'WEATHER',
      provider: 'NOAA Global Wave & Tropical Weather Radar',
      syncFrequencyMins: 60,
      lastSyncTimestamp: '25 mins ago (10:05:00)',
      status: 'ONLINE',
      latencyMs: 195,
      recordsSyncedToday: 1420,
      endpointUrl: 'https://weather.marine-forecast.org/v1/maritime-routes',
      authType: 'API_KEY',
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTriggerSync = (id: string, name: string) => {
    setSyncingId(id);
    setTimeout(() => {
      setConnectors(prev =>
        prev.map(c => (c.id === id ? { ...c, lastSyncTimestamp: 'Just now (10:30:00)', status: 'ONLINE' } : c))
      );
      setSyncingId(null);
      showToast(`Data synchronization for "${name}" completed successfully!`);
    }, 1200);
  };

  const handleSyncAll = () => {
    setSyncingId('ALL');
    setTimeout(() => {
      setConnectors(prev =>
        prev.map(c => ({ ...c, lastSyncTimestamp: 'Just now', status: 'ONLINE' }))
      );
      setSyncingId(null);
      showToast('All 5 external integration data connectors re-synchronized.');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                EXTERNAL CONNECTORS & FEEDS
              </span>
              <span className="text-xs text-slate-400 font-bold">• 99.98% Uptime</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">
              Integrations & Data Freshness Engine
            </h2>
            <p className="text-xs text-slate-500">
              Live telemetry pipelines, carrier API sync frequencies, Forex benchmark feeds, and EDI gate manifests.
            </p>
          </div>
        </div>

        <button
          onClick={handleSyncAll}
          disabled={syncingId === 'ALL'}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-75"
        >
          <RefreshCw className={`w-4 h-4 ${syncingId === 'ALL' ? 'animate-spin' : ''}`} />
          <span>{syncingId === 'ALL' ? 'Synchronizing All...' : 'Trigger Sync All'}</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Health Metrics Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Data Freshness Index
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">99.8%</p>
            <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <Check className="w-3 h-3" />
              <span>Real-Time Polling</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Avg API Ingress Latency
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">189 ms</p>
            <p className="text-[11px] text-blue-600 font-bold flex items-center gap-1 mt-1">
              <span>Optimal Network Speed</span>
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Records Ingested Today
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">36,510</p>
            <p className="text-[11px] text-purple-600 font-bold flex items-center gap-1 mt-1">
              <span>+12% vs yesterday</span>
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Active Connectors
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">5 / 5</p>
            <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <span>All Systems Operational</span>
            </p>
          </div>
          <div className="p-3 bg-slate-900 text-white rounded-2xl">
            <Server className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Connectors Table & Cards */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Connected Integration Pipelines
            </h3>
            <p className="text-xs text-slate-500">
              Live automated background data collectors feeding calculations and container maps
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            5 Active Pipelines
          </span>
        </div>

        <div className="space-y-3">
          {connectors.map((connector) => (
            <div
              key={connector.id}
              className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0 animate-pulse" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-slate-900">{connector.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
                      {connector.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                      {connector.authType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Provider: <strong className="text-slate-700">{connector.provider}</strong> • Endpoint: <span className="font-mono text-[11px] text-slate-600">{connector.endpointUrl}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs shrink-0 justify-between lg:justify-end">
                <div className="text-right">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Cadence / Last Synced</div>
                  <div className="font-bold text-slate-800">
                    Every {connector.syncFrequencyMins}m • <span className="text-slate-500">{connector.lastSyncTimestamp}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Latency / Records</div>
                  <div className="font-mono font-bold text-emerald-700">
                    {connector.latencyMs} ms • {connector.recordsSyncedToday.toLocaleString()} recs
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedConnectorPayload(connector)}
                    className="p-2 bg-white hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    title="Inspect Schema & Payload"
                  >
                    <Code className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleTriggerSync(connector.id, connector.name)}
                    disabled={syncingId === connector.id}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-70"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === connector.id ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* JSON Payload Inspection Modal */}
      {selectedConnectorPayload && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm text-cyan-400 uppercase tracking-wider">
                  Live Payload Telemetry: {selectedConnectorPayload.name}
                </h3>
                <p className="text-xs text-slate-400">Authenticated stream response schema</p>
              </div>
              <button onClick={() => setSelectedConnectorPayload(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72">
{JSON.stringify(
  {
    connectorId: selectedConnectorPayload.id,
    provider: selectedConnectorPayload.provider,
    status: 'ACTIVE_STREAM',
    authProtocol: selectedConnectorPayload.authType,
    lastHeartbeat: new Date().toISOString(),
    metrics: {
      latencyMs: selectedConnectorPayload.latencyMs,
      ingressCount: selectedConnectorPayload.recordsSyncedToday,
      sampleRecord: {
        vesselMmsi: '413902341',
        vesselName: 'MAERSK MC-KINNEY MOLLER',
        imo: '9619907',
        headingDeg: 142.5,
        speedKnots: 18.4,
        lat: 1.2833,
        lon: 103.85,
        destination: 'SGSIN',
        etaUtc: '2026-08-28T14:00:00Z',
      }
    }
  },
  null,
  2
)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedConnectorPayload(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
