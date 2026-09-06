import React from 'react';
import {
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  BookOpen,
  CloudRain,
  Gauge,
  TrendingUp,
  Globe,
  Sliders,
  CheckCircle2,
  Clock,
  Search,
  FileText,
  Layers,
  Sparkles,
  AlertTriangle,
  History,
  Activity,
  Zap,
  ChevronRight,
  Database
} from 'lucide-react';

export type CustomsOfficerTab =
  | 'overview'
  | 'case-console'
  | 'hs-tariffs'
  | 'rag-regulations'
  | 'risk-engine'
  | 'weather-radar'
  | 'ml-pricing'
  | 'tracking'
  | 'signoff-audit';

interface CustomsOfficerSidebarNavProps {
  activeTab: CustomsOfficerTab;
  onSelectTab: (tab: CustomsOfficerTab) => void;
  pendingCasesCount?: number;
  officerName?: string;
  officerEmail?: string;
}

interface NavItem {
  id: CustomsOfficerTab;
  label: string;
  subLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
  highlight?: boolean;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const CustomsOfficerSidebarNav: React.FC<CustomsOfficerSidebarNavProps> = ({
  activeTab,
  onSelectTab,
  pendingCasesCount = 3,
  officerName = 'Rajesh Varma',
  officerEmail = 'customer.officer@freighthub.in',
}) => {
  const navGroups: NavGroup[] = [
    {
      groupName: 'VERIFICATION & EDITING DESK',
      items: [
        {
          id: 'case-console',
          label: 'Verification & Edit Console',
          subLabel: 'Verify consignments & manual editing',
          icon: UserCheck,
          badge: pendingCasesCount > 0 ? `${pendingCasesCount} Pending` : undefined,
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-black',
          highlight: true,
        },
        {
          id: 'hs-tariffs',
          label: 'Manual HS Tariff Editor',
          subLabel: 'Edit & verify 8-digit HS, BCD & IGST',
          icon: Database,
          badge: 'Editor',
          badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200 font-bold',
        },
      ],
    },
    {
      groupName: 'REGULATORY COMPLIANCE & AUDIT',
      items: [
        {
          id: 'rag-regulations',
          label: 'CBIC / DGFT Regulatory RAG',
          subLabel: 'Legal citations & statutory rules',
          icon: BookOpen,
        },
        {
          id: 'signoff-audit',
          label: 'Verification & Edit Audit Log',
          subLabel: 'Timestamped sign-offs & manual edits',
          icon: History,
          badge: 'Immutable',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Officer Identity & Status Badge */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/40 text-white rounded-3xl p-5 shadow-sm border border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800/80">
                OFFICER DESK
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-sm font-black text-white truncate mt-0.5">{officerName}</h3>
            <p className="text-[10px] text-slate-400 truncate">{officerEmail}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-bold">Desk Clearance Status:</span>
          <span className="text-emerald-400 font-black flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            ICEGATE Live
          </span>
        </div>
      </div>

      {/* Main Navigation Container */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-5">
        <div className="flex items-center justify-between px-2 text-[10px] font-black text-amber-700 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>OFFICER NAVIGATION</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">v3.4 Desk</span>
        </div>

        <nav className="space-y-4">
          {navGroups.map((group) => (
            <div key={group.groupName} className="space-y-1">
              <div className="px-2.5 py-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                {group.groupName}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer text-left ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 ring-1 ring-slate-800'
                          : 'text-slate-700 hover:bg-amber-50/60 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-1.5 rounded-xl transition-colors shrink-0 ${
                            isActive
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-black">{item.label}</div>
                          {item.subLabel && (
                            <div
                              className={`text-[10px] truncate font-normal ${
                                isActive ? 'text-slate-300' : 'text-slate-400'
                              }`}
                            >
                              {item.subLabel}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] border ${
                              item.badgeColor || (isActive ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-100 text-slate-700 border-slate-200')
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isActive ? 'text-amber-400 translate-x-0.5' : 'text-slate-300'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Officer Quick Metrics / Info Footer */}
        <div className="pt-3 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-2 text-xs">
            <div className="flex items-center justify-between font-black text-amber-900 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                Compliance Health
              </span>
              <span>96.4% Pass</span>
            </div>
            <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-600 h-full rounded-full" style={{ width: '96.4%' }} />
            </div>
            <p className="text-[10px] text-amber-800 leading-tight">
              Avg review turnaround: <span className="font-bold">4.2 mins</span>. ICEGATE CBIC Gateway connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
