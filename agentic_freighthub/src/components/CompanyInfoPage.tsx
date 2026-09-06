import React, { useEffect } from 'react';
import {
  HelpCircle,
  Tag,
  Mail,
  ArrowLeft,
  Briefcase,
  Award,
  Sparkles
} from 'lucide-react';
import { AboutSection } from './AboutSection';
import { BrokerAboutSection } from './BrokerAboutSection';
import { PromotionsSection } from './PromotionsSection';
import { ContactSection } from './ContactSection';
import { UserRole } from '../types';

interface CompanyInfoPageProps {
  userRole?: UserRole;
  initialSection?: 'about' | 'services' | 'contact';
  targetSection?: string;
  selectedCoupon?: string | null;
  onApplyCoupon?: (code: string) => void;
  onNavigateBack?: () => void;
  onAccessSystem?: () => void;
  onNavigateToWorkspace?: (view?: 'dashboard' | 'calculation') => void;
  brokerName?: string;
  brokerEmail?: string;
}

export const CompanyInfoPage: React.FC<CompanyInfoPageProps> = ({
  userRole = 'customer',
  initialSection,
  targetSection,
  selectedCoupon = null,
  onApplyCoupon,
  onNavigateBack,
  onAccessSystem,
  onNavigateToWorkspace,
  brokerName,
  brokerEmail,
}) => {
  const activeSection = initialSection || targetSection;
  const isBroker = userRole === 'broker';

  // Smooth scroll to targeted section on load
  useEffect(() => {
    if (activeSection) {
      setTimeout(() => {
        const elem = document.getElementById(`${activeSection}-section`);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeSection]);

  const scrollToSection = (id: string) => {
    const elem = document.getElementById(`${id}-section`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleReturn = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else if (onNavigateToWorkspace) {
      onNavigateToWorkspace(userRole === 'admin' ? 'dashboard' : 'calculation');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 w-full">
      {/* Top Breadcrumb & Return Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReturn}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {userRole === 'admin'
                ? 'Back to Admin Control'
                : userRole === 'freight-agent'
                ? 'Back to Freight Agent Desk'
                : userRole === 'customs-officer'
                ? 'Back to Customs Officer Desk'
                : 'Back to Freight Calculator'}
            </span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="text-xs font-extrabold text-slate-600">
            Company & Capabilities Overview
          </div>
        </div>

        {/* Quick Anchor Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => scrollToSection('about')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              isBroker
                ? 'text-slate-700 hover:text-amber-600 hover:bg-white'
                : 'text-slate-700 hover:text-blue-600 hover:bg-white'
            }`}
          >
            <HelpCircle className={`w-3.5 h-3.5 ${isBroker ? 'text-amber-600' : 'text-blue-600'}`} />
            <span>{isBroker ? 'Broker Network About' : 'About Us'}</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('services')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            <span>{isBroker ? 'Broker Solutions' : 'Services & Offers'}</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('contact')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-600 hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBroker ? 'Broker Operations Desk' : 'Contact Us'}</span>
          </button>
        </div>
      </div>

      {/* Hero Banner tailored for Role */}
      {isBroker ? (
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-2xl p-5 sm:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full">
                LICENSED INTERMEDIARY NETWORK
              </span>
              <span className="text-[10px] text-slate-400 font-bold hidden sm:inline-block">
                PARTNER ORG #BRK-8942-IN
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              Apex Freight Brokerage Infrastructure & Carrier Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Explore Tier-1 ocean & air carrier procurement contracts, dynamic profit spread modeling, white-label client quote dispatch, and our 24/7 dedicated broker escalation desk.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-2xl p-5 sm:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-0.5 rounded-full">
                GLOBAL LOGISTICS NETWORK
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              Intelligent Freight Solutions & Global Port Distance Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Explore our automated quotation calculation methodology, comprehensive ocean/air services with seasonal discounts, and 24/7 commercial operations support.
            </p>
          </div>
        </div>
      )}

      {/* 1. ABOUT SECTION */}
      {isBroker ? <BrokerAboutSection /> : <AboutSection />}

      {/* 2. SERVICES & OFFERS SECTION */}
      <PromotionsSection
        selectedCoupon={selectedCoupon}
        onApplyCoupon={(code) => {
          if (onApplyCoupon) onApplyCoupon(code);
          if (onAccessSystem) {
            onAccessSystem();
          } else if (onNavigateToWorkspace) {
            onNavigateToWorkspace('calculation');
          }
        }}
      />

      {/* 3. CONTACT SECTION */}
      <ContactSection />
    </div>
  );
};

