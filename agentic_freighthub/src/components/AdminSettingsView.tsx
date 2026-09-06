import React, { useState } from 'react';
import {
  Settings,
  Shield,
  DollarSign,
  Globe,
  Bell,
  Save,
  CheckCircle2,
  Lock,
  Server,
  Key,
  Sliders,
  Mail,
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // General Settings
  const [platformName, setPlatformName] = useState('FreightHub Enterprise 2026');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [quoteValidityDays, setQuoteValidityDays] = useState(14);
  const [standardGstPct, setStandardGstPct] = useState(18);

  // Commercial Automation
  const [autoApprovalLimit, setAutoApprovalLimit] = useState(500000);
  const [minMarginPctForAutoApproval, setMinMarginPctForAutoApproval] = useState(12.0);
  const [requireDualApprovalDiscount, setRequireDualApprovalDiscount] = useState(true);

  // Security Policies
  const [enforceTwoFactor, setEnforceTwoFactor] = useState(true);
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(30);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Notifications
  const [supportEmail, setSupportEmail] = useState('support@freighthub.com');
  const [webhookUrl, setWebhookUrl] = useState('https://webhook.site/freighthub/v1/quote-events');
  const [emailQuoteDispatch, setEmailQuoteDispatch] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Platform configurations and governance settings saved successfully!');
  };

  const handleResetDefaults = () => {
    setQuoteValidityDays(14);
    setStandardGstPct(18);
    setAutoApprovalLimit(500000);
    setMinMarginPctForAutoApproval(12.0);
    setSessionTimeoutMins(30);
    showToast('System settings restored to default baseline.');
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-2xl border border-slate-200 shadow-sm">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                PLATFORM CONFIGURATION
              </span>
              <span className="text-xs text-slate-400 font-bold">• Global Environment Settings</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">
              System Settings & Commercial Governance
            </h2>
            <p className="text-xs text-slate-500">
              Configure system currencies, quotation validity periods, security thresholds, and automated approval policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: General & Currency */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Globe className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
              General & Regional Formatting
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">Platform Display Name</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">Default Base Currency</label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                >
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="AED">AED (د.إ - UAE Dirham)</option>
                  <option value="SGD">SGD (S$ - Singapore Dollar)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">System Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">Quote Rate Lock (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={quoteValidityDays}
                  onChange={(e) => setQuoteValidityDays(parseInt(e.target.value) || 14)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">Standard GST Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={standardGstPct}
                  onChange={(e) => setStandardGstPct(parseFloat(e.target.value) || 18)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Automated Approval Policies */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-purple-600" />
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
              Commercial Quotation Policies
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">Auto-Approval Max Limit (₹)</label>
                <span className="font-mono font-bold text-purple-700">₹{autoApprovalLimit.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={100000}
                max={2000000}
                step={50000}
                value={autoApprovalLimit}
                onChange={(e) => setAutoApprovalLimit(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Quotes below this value are auto-confirmed if meeting minimum margin criteria.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">
                Minimum Target Sales Margin for Auto-Approval (%)
              </label>
              <input
                type="number"
                min={5}
                max={35}
                step={0.5}
                value={minMarginPctForAutoApproval}
                onChange={(e) => setMinMarginPctForAutoApproval(parseFloat(e.target.value) || 12)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-extrabold text-slate-800">Require Broker Dual Signature on Promos</div>
                  <div className="text-[10px] text-slate-400">Enforce manual signoff when shipper applies promo coupons &gt; 15%</div>
                </div>
                <input
                  type="checkbox"
                  checked={requireDualApprovalDiscount}
                  onChange={(e) => setRequireDualApprovalDiscount(e.target.checked)}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Security & Session Rules */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-red-600" />
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
              Security & Access Control
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-extrabold text-slate-800">Mandatory 2FA for Admin & Broker Desks</div>
                <div className="text-[10px] text-slate-400">Require OTP or biometric authentication on elevated logins</div>
              </div>
              <input
                type="checkbox"
                checked={enforceTwoFactor}
                onChange={(e) => setEnforceTwoFactor(e.target.checked)}
                className="w-5 h-5 accent-red-600 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">Session Inactivity (Mins)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={sessionTimeoutMins}
                  onChange={(e) => setSessionTimeoutMins(parseInt(e.target.value) || 30)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">Max Failed Logins</label>
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={maxLoginAttempts}
                  onChange={(e) => setMaxLoginAttempts(parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-red-600">Emergency Maintenance Mode</div>
                <div className="text-[10px] text-slate-400">Lock non-admin access for live schema or server upgrades</div>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 accent-red-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Notifications & Webhook Sync */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Mail className="w-5 h-5 text-emerald-600" />
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
              Notifications & Outbound Webhooks
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">Primary Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">Quote Event Outbound Webhook URL</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-extrabold text-slate-800">Instant PDF Quote Dispatch via Email</div>
                  <div className="text-[10px] text-slate-400">Send generated commercial PDF quote directly to shipper upon confirmation</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailQuoteDispatch}
                  onChange={(e) => setEmailQuoteDispatch(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
