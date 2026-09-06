import React, { useState } from 'react';
import {
  ShieldAlert,
  CloudRain,
  Compass,
  Wind,
  Waves,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Bell,
  RefreshCw,
  Sliders,
  TrendingUp,
  MapPin,
  Anchor,
  Ship,
  Navigation,
  Eye,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  ShipmentRiskAssessment,
  WeatherAssessment,
  WeatherAlert,
  RiskLevel
} from '../types/milestone3';
import { SEEDED_RISK_ASSESSMENTS, SEEDED_WEATHER_ASSESSMENTS } from '../data/milestone3Data';

export const RiskWeatherDashboardWorkspace: React.FC = () => {
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>('MAA-SGSIN');
  const [weatherData, setWeatherData] = useState<WeatherAssessment>(SEEDED_WEATHER_ASSESSMENTS['MAA-SGSIN']);
  const [riskData, setRiskData] = useState<ShipmentRiskAssessment>(SEEDED_RISK_ASSESSMENTS['SHP-1002']);

  // Custom Weight Sliders (Defaults from M3 specification: 30%, 25%, 20%, 15%, 10%)
  const [weights, setWeights] = useState({
    weather: 30,
    customs: 25,
    route: 20,
    port: 15,
    cargo: 10,
  });

  // Dynamic Composite Score Calculation
  const compositeScore = Math.round(
    (riskData.weather_score * (weights.weather / 100)) +
    (riskData.customs_score * (weights.customs / 100)) +
    (riskData.route_score * (weights.route / 100)) +
    (riskData.port_score * (weights.port / 100)) +
    (riskData.cargo_score * (weights.cargo / 100))
  );

  // Alerts State
  const [alerts, setAlerts] = useState<WeatherAlert[]>(weatherData?.active_alerts || []);
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED'>('ALL');

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts((prev) =>
      (prev || []).map((a) => (a && a.id === id ? { ...a, acknowledged_at: new Date().toISOString() } : a))
    );
  };

  const filteredAlerts = (alerts || []).filter((a) => {
    if (!a) return false;
    if (alertFilter === 'ACTIVE') return !a.acknowledged_at;
    if (alertFilter === 'ACKNOWLEDGED') return !!a.acknowledged_at;
    return true;
  });

  const getRiskLevelBadge = (score: number) => {
    if (score >= 70) return <span className="bg-red-950 text-red-300 font-bold px-2 py-0.5 rounded border border-red-800">CRITICAL</span>;
    if (score >= 45) return <span className="bg-amber-950 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-800">ELEVATED</span>;
    if (score >= 25) return <span className="bg-yellow-950 text-yellow-300 font-bold px-2 py-0.5 rounded border border-yellow-800">MODERATE</span>;
    return <span className="bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-800">LOW</span>;
  };

  return (
    <div id="risk-weather-dashboard-workspace" className="max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Shipment Risk Intelligence & Live Weather Operations
              <span className="text-xs bg-amber-900/60 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-700/50">
                Phase 5 Analytics
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Composite 5-pillar risk calculation engine with real-time marine storm alerts and voyage disruption telemetry
            </p>
          </div>
        </div>

        {/* Route Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Corridor:</span>
          <select
            value={selectedRouteKey}
            onChange={(e) => {
              const key = e.target.value;
              setSelectedRouteKey(key);
              if (SEEDED_WEATHER_ASSESSMENTS[key]) setWeatherData(SEEDED_WEATHER_ASSESSMENTS[key]);
            }}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-white cursor-pointer"
          >
            <option value="MAA-SGSIN">Chennai (MAA) → Singapore (SGSIN)</option>
            <option value="BOM-NLRTM">Mumbai (BOM) → Rotterdam (NLRTM)</option>
            <option value="CCU-AEJEA">Kolkata (CCU) → Jebel Ali (AEJEA)</option>
          </select>
        </div>
      </div>

      {/* Bento Grid: 5-Pillar Score Breakdown & Interactive Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Composite Score & Pillar Bars (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                5-Pillar Composite Risk Model
              </h3>
              <p className="text-xs text-slate-400">Calculated weighted score based on real-time sensory telemetry</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-mono text-white">{compositeScore}/100</span>
              {getRiskLevelBadge(compositeScore)}
            </div>
          </div>

          {/* 5 Risk Pillar Progress Bars */}
          <div className="space-y-4">
            {/* Pillar 1: Weather (30%) */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Weather & Sea State Risk
                </span>
                <span className="text-slate-200 font-mono">{riskData.weather_score}/100 (Weight {weights.weather}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${riskData.weather_score}%` }}
                />
              </div>
            </div>

            {/* Pillar 2: Customs (25%) */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> Customs Compliance Risk
                </span>
                <span className="text-slate-200 font-mono">{riskData.customs_score}/100 (Weight {weights.customs}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${riskData.customs_score}%` }}
                />
              </div>
            </div>

            {/* Pillar 3: Route (20%) */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" /> Route & Corridor Bottleneck Risk
                </span>
                <span className="text-slate-200 font-mono">{riskData.route_score}/100 (Weight {weights.route}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${riskData.route_score}%` }}
                />
              </div>
            </div>

            {/* Pillar 4: Port Congestion (15%) */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5 text-cyan-400" /> Port Berth Congestion Risk
                </span>
                <span className="text-slate-200 font-mono">{riskData.port_score}/100 (Weight {weights.port}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all"
                  style={{ width: `${riskData.port_score}%` }}
                />
              </div>
            </div>

            {/* Pillar 5: Cargo Commodity (10%) */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Ship className="w-3.5 h-3.5 text-amber-400" /> Cargo Fragility & Hazard Risk
                </span>
                <span className="text-slate-200 font-mono">{riskData.cargo_score}/100 (Weight {weights.cargo}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${riskData.cargo_score}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts Inbox (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Disruption Alerts Inbox</h3>
            </div>

            <div className="flex gap-1 text-[11px] font-bold">
              {(['ALL', 'ACTIVE', 'ACKNOWLEDGED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setAlertFilter(f)}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    alertFilter === f ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts Feed */}
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-lg border text-xs ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-red-950/20 border-red-800/80'
                    : 'bg-amber-950/20 border-amber-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> {alert.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{alert.route_id}</span>
                </div>

                <p className="text-[11px] text-slate-300 leading-normal mb-2.5">{alert.message}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px]">
                  <span className="text-slate-400">Recommendation: <strong className="text-slate-200">{alert.acknowledged_at ? 'Monitor conditions' : 'Review & acknowledge alert'}</strong></span>
                  {!alert.acknowledged_at ? (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded font-semibold transition-colors cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Acknowledged
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weather Overlay Map Component (Full-Width Interactive Canvas/Map Area) */}
      <div id="weather-overlay-map-container" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" />
              Live Marine Weather & Swell Overlay (Corridor: {weatherData.route_id})
            </h3>
            <p className="text-xs text-slate-400">
              Live AIS vessel tracking overlay with wave height, gust speed, and squall zone forecasting
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-blue-400 font-mono">
              <Waves className="w-3.5 h-3.5" /> Max Swell: <strong>{Math.max(0, ...(weatherData.sampled_observations || []).map((o) => o.wave_height))}m</strong>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono">
              <Wind className="w-3.5 h-3.5" /> Max Gust: <strong>{Math.max(0, ...(weatherData.sampled_observations || []).map((o) => o.wind_speed))} kts</strong>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-mono">
              <Thermometer className="w-3.5 h-3.5" /> Avg Temp: <strong>{((weatherData.sampled_observations || []).length > 0 ? (weatherData.sampled_observations.reduce((sum, o) => sum + o.temperature, 0) / weatherData.sampled_observations.length) : 0).toFixed(1)}°C</strong>
            </div>
          </div>
        </div>

        {/* Vector Weather Visualization Box */}
        <div className="h-64 sm:h-80 w-full bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden flex flex-col justify-between p-6">
          {/* Background Map Graphic Elements */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Nautical Route Waypoints Vector */}
          <div className="relative z-10 flex items-center justify-between w-full h-full my-auto px-4 sm:px-12">
            {/* Waypoint 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-lg">
                1
              </div>
              <span className="font-bold text-xs text-white mt-2">Chennai Port</span>
              <span className="text-[10px] text-emerald-400 font-mono">Wave: 1.4m | Wind: 14kts</span>
            </div>

            {/* Path 1 -> 2 */}
            <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500 via-amber-500 to-blue-500 mx-2 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-950/90 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded text-[10px] font-mono">
                ⚠ Bay of Bengal Squall Zone
              </div>
            </div>

            {/* Waypoint 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-amber-600 border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-lg animate-pulse">
                2
              </div>
              <span className="font-bold text-xs text-white mt-2">Malacca Strait</span>
              <span className="text-[10px] text-amber-400 font-mono">Wave: 3.2m | Wind: 38kts</span>
            </div>

            {/* Path 2 -> 3 */}
            <div className="flex-1 h-0.5 bg-gradient-to-r from-amber-500 to-emerald-500 mx-2" />

            {/* Waypoint 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-lg">
                3
              </div>
              <span className="font-bold text-xs text-white mt-2">Singapore Port</span>
              <span className="text-[10px] text-emerald-400 font-mono">Wave: 0.8m | Calm</span>
            </div>
          </div>

          {/* Bottom Weather Status Footnote */}
          <div className="relative z-10 bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Reroute Advisory: <strong className="text-white">Route deviation via South Nicobar corridor avoids 3.2m swells (+1.5 Transit Days).</strong>
            </span>
            <span className="text-emerald-400 font-semibold font-mono">IMD / NOAA Global Marine Feed Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
