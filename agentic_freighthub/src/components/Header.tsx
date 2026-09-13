import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Calculator,
  HelpCircle,
  Tag,
  BarChart3,
  Mail,
  User,
  LogOut,
  Sliders,
  FileText,
  Briefcase,
  Globe,
  Radar,
  Calendar as CalendarIcon,
  TrendingUp,
  Anchor,
  Menu,
  X,
  Compass,
  Package,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
  UserCheck,
} from 'lucide-react';
import { UserRole } from '../types';
import { AdminTab } from './AdminSidebarNav';

interface HeaderProps {
  activeTab: string;
  workspaceView?: 'dashboard' | 'calculation' | 'routes' | 'tracking' | 'quotations' | 'test-scenarios' | 'customer-documents' | 'agent-documents' | 'compare-quotes' | 'selected-quotes';
  adminSubTab?: AdminTab;
  setActiveTab: (tab: string) => void;
  onSelectAdminTab?: (tab: AdminTab) => void;
  isAuthenticated: boolean;
  userEmail: string;
  userRole?: UserRole;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onNavigateToWorkspace: (view?: 'dashboard' | 'calculation' | 'tracking' | 'routes' | 'quotations' | 'test-scenarios' | 'customer-documents' | 'agent-documents' | 'compare-quotes' | 'selected-quotes') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  workspaceView = 'calculation',
  adminSubTab = 'home',
  setActiveTab,
  onSelectAdminTab,
  isAuthenticated,
  userEmail,
  userRole = 'customer',
  onOpenAuthModal,
  onLogout,
  onNavigateToWorkspace,
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState<boolean>(false);

  // Close hamburger menu on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHamburgerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isUserPortal = isAuthenticated && userRole === 'customer';

  const handleNavClick = (id: string) => {
    setIsHamburgerOpen(false);
    if (id === 'calculator' || id === 'calculation') {
      setActiveTab('workspace');
      onNavigateToWorkspace('calculation');
    } else if (id === 'my-quotes' || id === 'dashboard') {
      setActiveTab('workspace');
      onNavigateToWorkspace('dashboard');
    } else if (id === 'quotations') {
      setActiveTab('workspace');
      onNavigateToWorkspace('quotations');
    } else if (id === 'routes') {
      setActiveTab('workspace');
      onNavigateToWorkspace('routes');
    } else if (id === 'tracking') {
      setActiveTab('workspace');
      onNavigateToWorkspace('tracking');
    } else if (id === 'home') {
      setActiveTab('home');
    } else if (id === 'about' || id === 'services' || id === 'contact') {
      setActiveTab(id);
      setTimeout(() => {
        const element = document.getElementById(`${id}-section`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    } else {
      setActiveTab(id);
    }
  };

  const displayName =
    userRole === 'customs-officer'
      ? 'Customs Officer'
      : userRole === 'admin'
      ? 'System Admin'
      : userRole === 'freight-agent'
      ? 'Freight Agent'
      : userEmail.split('@')[0] || 'Customer';

  // Live Date State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const getLogoBadge = () => {
    if (!isAuthenticated) return 'SMART LOGISTICS ENGINE';
    if (userRole === 'customs-officer') return 'CUSTOMS OFFICER DESK';
    if (userRole === 'admin') return 'ADMIN CONSOLE';
    if (userRole === 'freight-agent') return 'FREIGHT AGENT DESK';
    return 'CUSTOMER FREIGHT ENGINE';
  };

  const getLogoColor = () => {
    if (!isAuthenticated) return 'bg-blue-600 shadow-blue-500/30';
    if (userRole === 'customs-officer') return 'bg-amber-500 shadow-amber-500/30 text-slate-950';
    if (userRole === 'admin') return 'bg-purple-600 shadow-purple-500/30';
    if (userRole === 'freight-agent') return 'bg-teal-600 shadow-teal-500/30 text-white';
    return 'bg-blue-600 shadow-blue-500/30';
  };

  return (
    <header className="bg-[#0F172A] text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo & Portal Badge */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => {
              if (isAuthenticated) {
                onNavigateToWorkspace(userRole === 'admin' ? 'dashboard' : 'calculation');
              } else {
                setActiveTab('home');
              }
            }}
          >
            <div className={`p-2 rounded-xl flex items-center justify-center shadow-lg ${getLogoColor()}`}>
              {userRole === 'customs-officer' && isAuthenticated ? (
                <UserCheck className="w-5 h-5 text-slate-950" />
              ) : userRole === 'freight-agent' && isAuthenticated ? (
                <Anchor className="w-5 h-5 text-white" />
              ) : userRole === 'admin' && isAuthenticated ? (
                <ShieldCheck className="w-5 h-5 text-white" />
              ) : (
                <Rocket className="w-5 h-5 text-white transform -rotate-45" />
              )}
            </div>
            <div>
              <div className="font-black text-lg tracking-wider text-white flex items-center gap-1">
                FREIGHTHUB
              </div>
              <div className="text-[10px] font-semibold tracking-widest text-cyan-400 uppercase">
                {getLogoBadge()}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Status Indicator for Admin / Business / Freight-Agent / Customer Officer desks */}
        {!isUserPortal && isAuthenticated && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">
              {userRole === 'customs-officer'
                ? 'Customs Officer Compliance Desk'
                : userRole === 'admin'
                ? 'Administrator Console'
                : userRole === 'freight-agent'
                ? 'Freight Agent Dispatch Operations'
                : 'Customer Portal'}
            </span>
          </div>
        )}

        {/* Public inline nav (Only when not logged in) */}
        {!isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'home', label: 'Home', icon: Rocket },
              { id: 'tracking', label: 'Tracking', icon: Globe },
              { id: 'about', label: 'About', icon: HelpCircle },
              { id: 'services', label: 'Services', icon: Tag },
              { id: 'contact', label: 'Contact Us', icon: Mail },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Section: Live Date + User Profile + Hamburger Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Date Display */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs shadow-inner select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <CalendarIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-semibold text-slate-200 text-xs tracking-tight whitespace-nowrap">
              {formattedDate}
            </span>
          </div>

          {/* User Profile & Auth Controls */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToWorkspace(userRole === 'admin' ? 'dashboard' : 'calculation')}
                className="bg-slate-800/90 border border-slate-700 hover:border-slate-600 text-slate-200 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    userRole === 'customs-officer'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : userRole === 'admin'
                      ? 'bg-purple-600'
                      : userRole === 'freight-agent'
                      ? 'bg-teal-600'
                      : 'bg-blue-600'
                  }`}
                >
                  {userRole === 'customs-officer'
                    ? 'C'
                    : userRole === 'admin'
                    ? 'A'
                    : userRole === 'freight-agent'
                    ? 'F'
                    : displayName.charAt(0).toUpperCase()}
                </div>
                <span className="capitalize font-bold hidden sm:inline">{displayName}</span>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                    userRole === 'customs-officer'
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                      : userRole === 'admin'
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                      : userRole === 'freight-agent'
                      ? 'bg-teal-500/30 text-teal-300 border border-teal-500/40'
                      : 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  {userRole === 'customs-officer' ? 'CUSTOMS OFFICER' : userRole === 'admin' ? 'ADMIN' : userRole === 'freight-agent' ? 'FREIGHT AGENT' : 'CUSTOMER'}
                </span>
              </button>

              <button
                onClick={onLogout}
                className="hidden sm:flex bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full text-xs font-semibold items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}

          {/* HAMBURGER STYLE MENU BUTTON FOR USER PANEL & MOBILE */}
          <button
            type="button"
            onClick={() => setIsHamburgerOpen(!isHamburgerOpen)}
            className={`p-2.5 rounded-xl text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer ${
              isHamburgerOpen
                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
          >
            {isHamburgerOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <>
                <Menu className="w-5 h-5" />
                {isUserPortal && <span className="text-xs font-bold hidden sm:inline">Menu</span>}
              </>
            )}
          </button>
        </div>
      </div>

      {/* HAMBURGER SLIDE-OUT / DROPDOWN NAVIGATION DRAWER */}
      {isHamburgerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setIsHamburgerOpen(false)}
          />

          {/* Slide-out Menu Panel */}
          <div className="fixed top-16 right-0 w-full sm:w-80 md:w-96 max-h-[calc(100vh-4rem)] bg-[#0F172A] border-l border-b border-slate-800 shadow-2xl z-50 overflow-y-auto p-5 space-y-6 animate-in slide-in-from-right duration-250">
            {/* User Profile Card (if logged in) */}
            {isAuthenticated ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-600/30">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white leading-tight">{displayName}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[160px]">{userEmail}</div>
                    <div className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{userRole === 'customer' ? 'CUSTOMER PORTAL ACTIVE' : `${userRole.toUpperCase()} DESK`}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center space-y-3">
                <p className="text-xs text-slate-400">Sign in to manage your freight calculations and active quotes</p>
                <button
                  onClick={() => {
                    setIsHamburgerOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/30"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In / Register</span>
                </button>
              </div>
            )}

            {/* User Portal Workspace Options (if user) */}
            {isUserPortal && (
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center justify-between">
                  <span>USER WORKSPACE SECTIONS</span>
                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded text-[9px]">
                    5 VIEWS
                  </span>
                </div>

                <div className="space-y-1.5">
                  {[
                    { id: 'calculation', label: 'Freight Calculator', desc: 'Tariff calculations & parameters', icon: Calculator, isLive: true },
                    { id: 'dashboard', label: 'Shipment Dashboard', desc: 'Active cargo & overview', icon: Package },
                    { id: 'quotations', label: 'Quotation History', desc: 'Saved & confirmed quotes', icon: FileText },
                    { id: 'routes', label: 'Corridor Routes', desc: 'Port pairs & nautical mileage', icon: Compass },
                    { id: 'tracking', label: 'AIS Fleet Radar', desc: 'Live vessel & air tracking', icon: Radar },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === 'workspace' && workspaceView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                            : 'bg-slate-900/60 hover:bg-slate-800 text-slate-200 border border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-cyan-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold">{item.label}</div>
                            <div className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{item.desc}</div>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* General Site Navigation Links */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                PLATFORM SECTIONS
              </div>

              <div className="grid grid-cols-1 gap-1">
                {[
                  { id: 'home', label: 'Home Page', icon: Rocket },
                  { id: 'about', label: 'About Platform', icon: HelpCircle },
                  { id: 'services', label: 'Services & Tariffs', icon: Tag },
                  { id: 'contact', label: 'Contact Support', icon: Mail },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 text-cyan-400 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons in Menu */}
            {isAuthenticated && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => {
                    handleNavClick('calculation');
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Generate New Quote</span>
                </button>

                <button
                  onClick={() => {
                    setIsHamburgerOpen(false);
                    onLogout();
                  }}
                  className="w-full bg-slate-900 hover:bg-red-950/40 text-red-400 border border-slate-800 hover:border-red-800/50 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
};
