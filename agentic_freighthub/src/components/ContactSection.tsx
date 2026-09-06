import React, { useState } from 'react';
import { Mail, Building2, Phone, Send, CheckCircle2 } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div id="contact-section" className="bg-[#0F172A] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 mb-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl w-fit shadow-lg shadow-blue-600/30">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Contact FreightHub Support
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Have custom enterprise shipping inquiries, API integration questions, or contract freight
              forwarder requests? Get in touch with our commercial operations team.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="text-xs text-slate-200 font-medium">
                FreightHub Center, Bandra-Kurla Complex (BKC), Mumbai, 400051
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <Phone className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="text-xs text-slate-200 font-medium">
                +91 (022) 8800-4492 / Commercial Support Desk
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="text-xs text-slate-200 font-medium">
                support@freighthub.in / rates@freighthub.in
              </div>
            </div>
          </div>
        </div>

        {/* Right Inquiry Form Card */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-black text-white mb-4">Send Us a Direct Inquiry</h3>

          {submitted ? (
            <div className="bg-emerald-950/60 border border-emerald-800 rounded-xl p-6 text-center space-y-3 my-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white text-sm">Inquiry Submitted Successfully</h4>
              <p className="text-xs text-slate-300">
                Thank you {name || 'Shipper'}. Our commercial operations desk will respond to {email} within 2 business hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-cyan-400 font-semibold hover:underline"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  YOUR NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  MESSAGE
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your freight inquiry..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span>SUBMIT SUPPORT INQUIRY</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-slate-800 text-center text-[11px] text-slate-500 font-medium">
        © 2026 FreightHub Intelligent Logistics Management System. All rights reserved.
      </div>
    </div>
  );
};
