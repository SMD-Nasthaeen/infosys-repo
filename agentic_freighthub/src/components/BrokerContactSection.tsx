import React, { useState } from 'react';
import {
  Briefcase,
  Mail,
  Building2,
  Phone,
  Send,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Zap,
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface BrokerContactSectionProps {
  brokerName?: string;
  brokerEmail?: string;
}

export const BrokerContactSection: React.FC<BrokerContactSectionProps> = ({
  brokerName = 'Freight Broker Partner',
  brokerEmail = 'broker@freighthub.com',
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [formName, setFormName] = useState(brokerName);
  const [agencyName, setAgencyName] = useState('Apex Freight Solutions Ltd');
  const [email, setEmail] = useState(brokerEmail);
  const [phone, setPhone] = useState('+91 98201 44820');
  const [inquiryType, setInquiryType] = useState('space-allocation');
  const [priority, setPriority] = useState<'URGENT' | 'STANDARD'>('URGENT');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div id="contact-section" className="bg-[#0F172A] text-white rounded-2xl p-5 sm:p-8 shadow-xl border border-slate-800 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Info Column: Broker Desk Information */}
        <div className="lg:col-span-5 space-y-5">
          <div className="space-y-2.5">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-xl w-fit shadow-lg shadow-amber-500/20">
              <Briefcase className="w-6 h-6 fill-current text-slate-950" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                PRIORITY BROKER DESK
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Broker Partner Support & Carrier Liaison
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Direct access for licensed freight forwarders, intermediary brokers, and agency reps. Resolve space allocations, spot rate concessions, and commission settlements with our 24/7 commercial desk.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">24/7 BROKER PRIORITY HOTLINE</div>
                <div className="text-xs font-bold text-white mt-0.5">+91 (022) 8800-4498 / Ext 4 (Broker Escalations)</div>
                <div className="text-[11px] text-amber-400 mt-0.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Average pickup time: &lt; 45 seconds</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">DIRECT EMAIL DESKS</div>
                <div className="text-xs font-bold text-white mt-0.5">brokers@freighthub.in</div>
                <div className="text-[11px] text-slate-400">Settlements: finance-settlement@freighthub.in</div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg shrink-0 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">COMMERCIAL CLEARING HUBS</div>
                <div className="text-xs font-bold text-white mt-0.5">Maritime Trade Tower, BKC, Mumbai 400051</div>
                <div className="text-[11px] text-slate-400">Regional Gateway: DAFZA Cargo Village, Dubai, UAE</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>SLA Resolution Guarantee:</span>
            </div>
            <span className="font-extrabold text-emerald-400">Under 15 Minutes</span>
          </div>
        </div>

        {/* Right Column: Interactive Broker Inquiry Form */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white">Direct Broker Inquiry & Escalation</h3>
              <p className="text-xs text-slate-400">Submit requests directly to our carrier allotment controllers</p>
            </div>
            <span className="bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
              HIGH PRIORITY ROUTING
            </span>
          </div>

          {submitted ? (
            <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-6 text-center space-y-3 my-4 animate-in fade-in duration-300">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-white text-base">Broker Escalation Dispatched</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Thank you, <span className="font-bold text-white">{formName}</span> ({agencyName}). Your inquiry has been tagged as <span className="font-bold text-amber-400">{priority}</span> and routed directly to the Carrier Operations Desk. A senior liaison manager will reach out to <span className="font-bold text-white">{email}</span> or <span className="font-bold text-white">{phone}</span> shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                }}
                className="mt-2 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold px-4 py-2 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                Submit Another Broker Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    BROKER / REPRESENTATIVE NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    AGENCY / BROKERAGE COMPANY
                  </label>
                  <input
                    type="text"
                    required
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    OFFICIAL BROKER EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    DIRECT PHONE / WHATSAPP
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    INQUIRY CATEGORY
                  </label>
                  <select
                    value={inquiryType}
                    onChange={(e) => setInquiryType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="space-allocation">Space Allocation & Vessel Booking</option>
                    <option value="spot-negotiation">Carrier Spot Rate Negotiation</option>
                    <option value="margin-setup">Custom Margin Rule / Markup Setup</option>
                    <option value="commission-settlement">Commission Settlement & Payout</option>
                    <option value="shipper-onboarding">Enterprise Shipper RFQ Onboarding</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    ROUTING PRIORITY
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPriority('URGENT')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        priority === 'URGENT'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>URGENT (15m)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('STANDARD')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        priority === 'STANDARD'
                          ? 'bg-blue-600 text-white shadow-md font-black'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>STANDARD</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  MESSAGE / SHIPMENT PARTICULARS
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify trade lane, carrier preference, TEU volume, or commission invoice reference..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>DISPATCH TO BROKER DESK</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
