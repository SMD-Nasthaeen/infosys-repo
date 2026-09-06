import React from 'react';
import {
  Tag,
  Ship,
  TrendingUp,
  FileCheck2,
  DollarSign,
  Shield,
  Layers,
  ArrowRight,
  Zap,
  CheckCircle2,
  Lock,
  Building
} from 'lucide-react';

interface BrokerServicesSectionProps {
  onNavigateToMarginStudio?: () => void;
  onNavigateToCarrierRates?: () => void;
}

export const BrokerServicesSection: React.FC<BrokerServicesSectionProps> = ({
  onNavigateToMarginStudio,
  onNavigateToCarrierRates,
}) => {
  const brokerServices = [
    {
      id: 'spot-procurement',
      title: 'Wholesale Spot Rate Index & Space Procurement',
      badge: 'TIER-1 CAPACITY',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      description:
        'Direct procurement access to negotiated ocean carrier contract slots (20GP, 40HC, Reefer) and chartered air freight allocations across 24 global shipping lanes with real-time spot index benchmarks.',
      highlights: ['Maersk, MSC & CMA CGM Direct Contract Slots', 'Instant BAF & THC Surcharge Recalculation', 'Guaranteed Space Protection on High-Demand Routes'],
      icon: Ship,
      actionLabel: 'Explore Spot Rates Matrix',
      actionTab: 'carrier-rates',
    },
    {
      id: 'margin-studio',
      title: 'Dynamic Broker Margin & Spread Engine',
      badge: 'PROFIT OPTIMIZER',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      description:
        'Interactive financial modeling console allowing brokers to define custom markup percentage spreads or fixed per-container fees, model tax liabilities (GST/TDS), and preview net brokerage profit before quote dispatch.',
      highlights: ['Customizable 5% to 30% Profit Spread Controls', 'Real-Time Sell Price vs. Buy Cost Audit', 'Automated Clearance Buffer Ingestion'],
      icon: TrendingUp,
      actionLabel: 'Launch Margin Studio',
      actionTab: 'margin-calculator',
    },
    {
      id: 'quote-customization',
      title: 'Shipper RFQ Intercept & Custom Quote Dispatch',
      badge: 'WORKFLOW ACCELERATOR',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description:
        'Seamlessly intercept incoming shipper requests, calibrate linehaul freight components, assign dedicated carrier alliances, and dispatch official commercial quotations with instant PDF generation.',
      highlights: ['1-Click Review & Rate Calibration', 'Official Branded Freight Quotation PDFs', 'Direct Shipper Status Synchronization'],
      icon: FileCheck2,
      actionLabel: 'Review Client Quotes',
      actionTab: 'client-quotes',
    },
    {
      id: 'commission-ledger',
      title: 'Automated Commission Ledger & Settlement Engine',
      badge: 'FINANCIAL TRANSPARENCY',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      description:
        'Full financial ledger tracking every booked TEU, managed air cargo consignment, and earned spread commission with automated monthly payout schedules and bank transfer receipts.',
      highlights: ['Multi-Currency Ledger (INR, USD, EUR, AED)', 'Clear Payout Milestones (Settled vs. Pending)', 'Exportable Accounting Sheets for Auditing'],
      icon: DollarSign,
      actionLabel: 'View Commission Ledger',
      actionTab: 'commission-ledger',
    },
    {
      id: 'port-cfs-handling',
      title: 'Dedicated Port CFS & Bonded Warehouse Handling',
      badge: 'LOGISTICS INFRASTRUCTURE',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description:
        'Priority terminal handling, bonded warehouse stuffing/de-stuffing, and fast-track customs compliance at Nhava Sheva (JNPT), Mundra, Chennai, and ICD Tughlakabad.',
      highlights: ['24/7 Port Operations Liaison', 'Bonded Storage & Container Stuffing Inspections', 'Fast-Track Bill of Entry / Shipping Bill Filing'],
      icon: Building,
      actionLabel: 'Access Port Operations',
      actionTab: 'margin-calculator',
    },
    {
      id: 'white-label',
      title: 'White-Label Broker Identity & SLA Safeguards',
      badge: 'ENTERPRISE READY',
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      description:
        'Maintain complete confidentiality of wholesale carrier buy-rates. Shippers receive beautifully branded quotes and invoices carrying your brokerage firm details and designated account representatives.',
      highlights: ['Complete Wholesale Cost Confidentiality', 'Custom Logo & Broker Registration ID Display', 'Guaranteed Service Level Agreement Safeguards'],
      icon: Lock,
      actionLabel: 'Broker Profile Settings',
      actionTab: 'margin-calculator',
    },
  ];

  return (
    <div id="services-section" className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200/80 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-md shadow-blue-600/20">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-blue-700 uppercase bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                BROKER SERVICES & COMMERCIAL SOLUTIONS
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Comprehensive Freight Brokerage Suite
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Procurement capacity, dynamic profit spread studio, and institutional settlement tools
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            6 Specialized Broker Modules
          </span>
        </div>
      </div>

      {/* Services Grid (2x3 on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {brokerServices.map((srv) => {
          const Icon = srv.icon;
          return (
            <div
              key={srv.id}
              className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-blue-400 hover:bg-white hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border ${srv.badgeColor}`}>
                    {srv.badge}
                  </span>
                </div>

                <h3 className="text-sm font-black text-slate-900 leading-snug">
                  {srv.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {srv.description}
                </p>

                <div className="pt-2 space-y-1.5 border-t border-slate-200/60">
                  {srv.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (srv.actionTab === 'carrier-rates' && onNavigateToCarrierRates) {
                    onNavigateToCarrierRates();
                  } else if (onNavigateToMarginStudio) {
                    onNavigateToMarginStudio();
                  }
                }}
                className="w-full bg-white hover:bg-slate-900 hover:text-white text-slate-800 font-extrabold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-200 shadow-sm cursor-pointer"
              >
                <span>{srv.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Broker Incentive Callout */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
              BROKER INCENTIVE PROGRAM
            </span>
            <span className="text-xs font-bold text-amber-300">Volume Tier Milestone</span>
          </div>
          <p className="text-xs text-slate-300 font-normal">
            Move 50+ TEUs/month to unlock an additional 1.5% carrier procurement discount and priority vessel berthing guarantees.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToMarginStudio}
          className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer"
        >
          Open Broker Studio
        </button>
      </div>
    </div>
  );
};
