import React from 'react';
import { Package, Calculator, Compass, Radar, FileText, ShieldCheck, FolderOpen } from 'lucide-react';
import { HelpdeskWidget } from './HelpdeskWidget';

export type UserWorkspaceView = 'dashboard' | 'calculation' | 'routes' | 'tracking' | 'quotations' | 'test-scenarios' | 'customer-documents' | 'agent-documents' | 'compare-quotes' | 'selected-quotes';

interface SidebarNavProps {
  activeView: UserWorkspaceView;
  onSelectView: (view: UserWorkspaceView) => void;
  quotationCount: number;
  userRole?: string;
}

interface NavItem {
  id: UserWorkspaceView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasDot?: boolean;
  badge?: number | string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeView,
  onSelectView,
  quotationCount,
  userRole,
}) => {
  const navItems: NavItem[] = [
    { id: 'calculation', label: 'Calculation', icon: Calculator, hasDot: true },
    { id: 'dashboard', label: 'Shipment', icon: Package },
    { id: 'routes', label: 'Routes', icon: Compass },
    { id: 'tracking', label: 'Tracking', icon: Radar },
    { id: 'test-scenarios', label: 'Core Test Suite', icon: ShieldCheck },
    // Add document views based on user role
    ...(userRole === 'customer' || userRole === 'user'
      ? [
          { id: 'compare-quotes' as UserWorkspaceView, label: 'Compare Quotes', icon: FolderOpen },
          { id: 'selected-quotes' as UserWorkspaceView, label: 'My Selections', icon: FolderOpen },
          { id: 'customer-documents' as UserWorkspaceView, label: 'My Documents', icon: FolderOpen },
        ]
      : []),
    ...(userRole === 'freight-agent'
      ? [{ id: 'agent-documents' as UserWorkspaceView, label: 'Document Review', icon: FolderOpen }]
      : []),
  ];

  return (
    <div className="space-y-4">
      {/* Top Freight Navigation Box */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
          <Package className="w-3.5 h-3.5" />
          <span>FREIGHT NAVIGATION</span>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {isActive && item.hasDot && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}

                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-600'
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

      {/* SPACE BELOW FREIGHT NAVIGATION: ONLY HELPDESK BOX */}
      <HelpdeskWidget />
    </div>
  );
};
