import React from 'react';
import { Calculator, Zap, Globe, Shield, ArrowRight, Settings, Briefcase } from 'lucide-react';
import { UserRole } from '../types';

interface HeroSectionProps {
  userRole?: UserRole;
  onAccessSystem: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ userRole = 'customer', onAccessSystem }) => {
  const isAdmin = userRole === 'admin';

  return (
    <div id="home-section" className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Warehouse Image Card */}
        <div className="lg:col-span-5 relative group overflow-hidden rounded-2xl shadow-xl">
          {/* Top Badge */}
          <div className={`absolute top-4 right-4 z-10 text-white font-bold text-[11px] px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wider ${
            isAdmin ? 'bg-purple-600 shadow-purple-600/30' : 'bg-blue-600 shadow-blue-600/30'
          }`}>
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{isAdmin ? 'ADMIN CONTROL CONSOLE' : 'INSTANT TARIFFS 2026'}</span>
          </div>

          {/* Warehouse Image */}
          <div className="relative h-[320px] w-full overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=80"
              alt="Automated Freight Warehouse"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
          </div>

          {/* Image Overlay Content */}
          <div className="absolute bottom-5 left-5 right-5 z-10 text-white">
            <div className="inline-flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold tracking-wider uppercase mb-1">
              <Globe className="w-3.5 h-3.5" />
              <span>{isAdmin ? 'ADMINISTRATION ENGINE' : 'MULTI-MODAL LOGISTICS ENGINE'}</span>
            </div>
            <h3 className="text-xl font-black text-white leading-snug">
              {isAdmin ? 'Freight Governance & Telemetry' : 'Port Distance & Freight Calculator'}
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {isAdmin ? 'Real-time System Audits & Tariff Overrides' : 'Calculated with Multi-Currency & Itemized Tariffs'}
            </p>
          </div>
        </div>

        {/* Right Hero Text Content */}
        <div className="lg:col-span-7 space-y-5">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
            isAdmin
              ? 'bg-purple-50 text-purple-700 border-purple-100'
              : 'bg-blue-50 text-blue-700 border-blue-100'
          }`}>
            <Shield className={`w-3.5 h-3.5 ${isAdmin ? 'text-purple-600' : 'text-blue-600'}`} />
            <span>{isAdmin ? 'SYSTEM ADMINISTRATOR PORTAL' : 'SHIPPER LOGISTICS PORTAL'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {isAdmin
              ? 'FreightHub Enterprise Control & Rate Governance'
              : 'Automated Freight Management & Port Distance Matrix'}
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            {isAdmin
              ? 'Welcome System Administrator. Configure global freight tariffs, adjust profit margins, manage fuel surcharges, audit customer quotations, and monitor system-wide logistics telemetry.'
              : 'Welcome Shipper. FreightHub delivers automated port-to-port ocean, air, and ground transport freight pricing. All calculations are computed in your selected currency with full itemized breakdowns.'}
          </p>

          <div className="pt-2">
            <button
              onClick={onAccessSystem}
              className={`text-white font-extrabold px-6 py-3.5 rounded-full text-xs uppercase tracking-wider flex items-center gap-3 transition-all shadow-lg hover:scale-[1.02] ${
                isAdmin
                  ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
              }`}
            >
              {isAdmin ? <Settings className="w-4 h-4" /> : <Calculator className="w-4 h-4" />}
              <span>{isAdmin ? 'ACCESS ADMIN OPERATIONS PORTAL' : 'CLICK HERE TO GENERATE FREIGHT QUOTATION'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
