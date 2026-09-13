import React from 'react';
import {
  Compass,
  Ship,
  Globe,
  Truck,
  Anchor,
  Radio,
  FileCheck2,
  Navigation,
  FolderOpen
} from 'lucide-react';

export type FreightAgentTab =
  | 'operations-overview'
  | 'quote-review'
  | 'route-optimizer'
  | 'carrier-spot-bidding'
  | 'cargo-tracking'
  | 'customs-dispatch'
  | 'document-review';

interface FreightAgentSidebarNavProps {
  activeTab: FreightAgentTab;
  onSelectTab: (tab: FreightAgentTab) => void;
  shipmentCount?: number;
  pendingQuoteCount?: number;
}

interface NavItem {
  id: FreightAgentTab;
  label: string;
  subLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
  highlight?: boolean;
}

export const FreightAgentSidebarNav: React.FC<FreightAgentSidebarNavProps> = ({
  activeTab,
  onSelectTab,
  shipmentCount = 14,
  pendingQuoteCount = 0,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'operations-overview',
      label: 'Agent Dispatch Desk',
      subLabel: 'Vessel schedules & live alerts',
      icon: Anchor,
    },
    {
      id: 'quote-review',
      label: 'Quote Review & Dispatch',
      subLabel: 'Customer quote requests pending approval',
      icon: FileCheck2,
      badge: pendingQuoteCount > 0 ? pendingQuoteCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      highlight: pendingQuoteCount > 0,
    },
    {
      id: 'cargo-tracking',
      label: 'Live Cargo Tracking',
      subLabel: 'AIS Vessel, Air & GPS Tracking',
      icon: Globe,
      badge: shipmentCount,
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-200',
    },
    {
      id: 'route-optimizer',
      label: 'Corridor & Route Matrix',
      subLabel: 'Transit time & multi-leg routes',
      icon: Compass,
      highlight: true,
    },
    {
      id: 'carrier-spot-bidding',
      label: 'Carrier Spot Bidding',
      subLabel: 'Direct Tier-1 shipping line rates',
      icon: Ship,
      badge: '6 Lines',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'customs-dispatch',
      label: 'Customs & CFS Gatepass',
      subLabel: 'Port terminal dispatch docs',
      icon: FileCheck2,
    },
    {
      id: 'document-review',
      label: 'Document Review',
      subLabel: 'Review & verify customer documents',
      icon: FolderOpen,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Freight Agent Navigation Menu */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between px-2 text-[10px] font-black text-teal-600 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5" />
            <span>FREIGHT AGENT DESK</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#0F172A] text-white shadow-md shadow-slate-900/20'
                    : 'text-slate-700 hover:bg-teal-50/60 hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isActive
                        ? 'bg-teal-500 text-white shadow-sm'
                        : item.highlight
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-extrabold truncate">{item.label}</div>
                    {item.subLabel && (
                      <div className="text-[10px] truncate font-normal text-slate-400">
                        {item.subLabel}
                      </div>
                    )}
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 border ${
                      isActive
                        ? 'bg-slate-800 text-teal-300 border-slate-700'
                        : item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Terminal & Port Ops Banner */}
      <div className="bg-gradient-to-br from-teal-900 to-slate-900 rounded-3xl p-5 text-white shadow-md space-y-3">
        <div className="flex items-center gap-2 text-teal-300 text-xs font-black uppercase tracking-wider">
          <Navigation className="w-4 h-4" />
          <span>Real-Time Fleet Radar</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Monitor active vessel positions, port congestion index, and automated CFS gate pass clearances across global marine corridors.
        </p>
        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
          <span>Carrier Slot API</span>
          <span className="text-teal-400 font-bold">● Connected</span>
        </div>
      </div>
    </div>
  );
};
