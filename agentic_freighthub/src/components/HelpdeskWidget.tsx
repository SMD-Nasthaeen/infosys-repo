import React, { useState } from 'react';
import {
  Headphones,
  PhoneCall,
  Mail,
  Check,
  Copy
} from 'lucide-react';

export const HelpdeskWidget: React.FC = () => {
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | null>(null);

  const supportPhone = '+91 22 8800 4492';
  const supportEmail = 'helpdesk@freightflow.io';

  const handleCopy = (text: string, type: 'phone' | 'email') => {
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
          <Headphones className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            HELPDESK SUPPORT
          </div>
          <h4 className="text-xs font-black text-slate-900 leading-tight">
            24/7 Freight Desk
          </h4>
        </div>
      </div>

      {/* Direct Contact Cards */}
      <div className="space-y-2.5">
        {/* Phone Contact */}
        <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-white text-blue-600 rounded-lg shadow-2xs border border-slate-200">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-extrabold uppercase text-slate-400">Direct Hotline</div>
              <div className="text-xs font-black text-slate-900 truncate">{supportPhone}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a
              href={`tel:${supportPhone.replace(/\s+/g, '')}`}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-colors"
              title="Call Helpdesk"
            >
              Call
            </a>
            <button
              type="button"
              onClick={() => handleCopy(supportPhone, 'phone')}
              className="p-1.5 bg-white hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 text-[10px] font-medium transition-colors cursor-pointer"
              title="Copy Phone Number"
            >
              {copiedField === 'phone' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Email Support */}
        <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-white text-blue-600 rounded-lg shadow-2xs border border-slate-200">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-extrabold uppercase text-slate-400">Email Support</div>
              <div className="text-xs font-black text-slate-900 truncate">{supportEmail}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a
              href={`mailto:${supportEmail}?subject=Freight%20Support%20Inquiry`}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-colors"
              title="Send Email"
            >
              Email
            </a>
            <button
              type="button"
              onClick={() => handleCopy(supportEmail, 'email')}
              className="p-1.5 bg-white hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 text-[10px] font-medium transition-colors cursor-pointer"
              title="Copy Email Address"
            >
              {copiedField === 'email' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
