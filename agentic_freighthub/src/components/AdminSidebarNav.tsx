import React from 'react';
import {
  ShieldAlert,
  Sliders,
  Database,
  FileText,
  MessageSquare,
  Users,
  Scale,
  Radio,
  Bell,
  Settings,
  ShieldCheck,
  Globe,
  Layers,
  Sparkles,
  ChevronRight,
  Activity
} from 'lucide-react';

export type AdminTab =
  | 'home'
  | 'users'
  | 'quotations'
  | 'tariffs'
  | 'setup'
  | 'risk-customs'
  | 'integrations'
  | 'alerts'
  | 'audit-logs'
  | 'settings'
  | 'tracking'
  | 'masterdata'
  | 'feedbacks'
  | 'activity-history';

interface AdminSidebarNavProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  quotationsCount: number;
  feedbacksCount?: number;
  usersCount?: number;
  alertsCount?: number;
}

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const AdminSidebarNav: React.FC<AdminSidebarNavProps> = ({
  activeTab,
  onSelectTab,
  quotationsCount,
  feedbacksCount = 2,
  usersCount = 6,
  alertsCount = 3,
}) => {
  const navGroups: NavGroup[] = [
    {
      groupName: 'CORE & WORKSPACE',
      items: [
        {
          id: 'home',
          label: 'Overview',
          icon: ShieldAlert,
        },
        {
          id: 'users',
          label: 'Users & RBAC',
          icon: Users,
          badge: usersCount ? `${usersCount}` : undefined,
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        },
        {
          id: 'quotations',
          label: 'Quotes & Shipments',
          icon: FileText,
          badge: quotationsCount,
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        },
        {
          id: 'tracking',
          label: 'Fleet Radar',
          icon: Globe,
        },
      ],
    },
    {
      groupName: 'RATES & INTELLIGENCE',
      items: [
        {
          id: 'tariffs',
          label: 'Tariff Rules',
          icon: Sliders,
          badge: 'Live',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        },
        {
          id: 'risk-customs',
          label: 'Risk & Customs',
          icon: Scale,
          badge: 'CBIC',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
        },
        {
          id: 'setup',
          label: '5 Masters Setup',
          icon: Layers,
          badge: '5 Masters',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        },
        {
          id: 'masterdata',
          label: 'Master Database',
          icon: Database,
          badge: '19 Colls',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
        },
      ],
    },
    {
      groupName: 'GOVERNANCE & SYSTEM',
      items: [
        {
          id: 'alerts',
          label: 'Alerts Monitor',
          icon: Bell,
          badge: alertsCount,
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        },
        {
          id: 'integrations',
          label: 'Integrations & Feeds',
          icon: Radio,
          badge: '5 Live',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        },
        {
          id: 'audit-logs',
          label: 'Audit Trail Logs',
          icon: ShieldCheck,
        },
        {
          id: 'activity-history',
          label: 'Activity History',
          icon: Activity,
          badge: 'Live',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        },
        {
          id: 'feedbacks',
          label: 'Feedback & Reviews',
          icon: MessageSquare,
          badge: feedbacksCount,
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        },
        {
          id: 'settings',
          label: 'System Settings',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-1.5 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-[11px] font-black text-purple-900 uppercase tracking-wider">
          <div className="p-1 bg-purple-100 text-purple-700 rounded-md">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <span>ADMIN DESK</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400">ONLINE</span>
        </div>
      </div>

      {/* Nav Groups */}
      <div className="space-y-3">
        {navGroups.map((group, gIdx) => (
          <div key={group.groupName} className="space-y-1">
            {/* Group Label */}
            <div className="px-2 py-0.5 text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{group.groupName}</span>
              <span className="text-[8px] font-mono text-slate-300 font-bold">{group.items.length}</span>
            </div>

            {/* Group Items */}
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full px-2.5 py-1.75 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                        : 'text-slate-700 hover:bg-purple-50/70 hover:text-purple-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`p-1 rounded-lg shrink-0 ${
                          isActive ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate text-xs font-extrabold">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1.5">
                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border leading-none ${
                            isActive
                              ? 'bg-white text-purple-700 border-white/40'
                              : item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3 h-3 text-purple-200" />}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Quick Status */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-1.5 text-[10px] text-slate-400 font-medium">
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-emerald-500" />
          <span className="font-semibold text-slate-600">Engine v3.0</span>
        </span>
        <span className="font-mono text-[9px] text-slate-400 font-bold">13 Modules</span>
      </div>
    </div>
  );
};
