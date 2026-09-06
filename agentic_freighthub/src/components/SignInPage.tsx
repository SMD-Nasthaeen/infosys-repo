import React, { useState, useEffect } from 'react';
import {
  Rocket,
  ShieldAlert,
  UserCheck,
  Lock,
  Mail,
  User,
  AtSign,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Info,
  Eye,
  EyeOff,
  Anchor,
  CloudRain,
  Cpu
} from 'lucide-react';
import { UserRole } from '../types';
import { userService } from '../services/userService';

interface SignInPageProps {
  onLoginSuccess: (email: string, role: UserRole, fullName?: string, username?: string) => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onLoginSuccess }) => {
  const [role, setRole] = useState<UserRole>('customer');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Ensure initial users are initialized
    userService.getUsers();
  }, []);

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setError(null);
    setSuccessMessage(null);
    // Clear credentials when switching roles
    setEmailOrUsername('');
    setPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (isRegistering) {
      if (role !== 'customer') {
        setError(`Self-registration is restricted. Only Customer accounts can be self-registered.`);
        return;
      }

      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }

      const res = userService.registerUser({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        role: 'customer',
        status: 'active',
        generatedBy: 'Self-Registered',
      });

      if (!res.success) {
        setError(res.error || 'Failed to register account.');
        return;
      }

      setSuccessMessage(`Customer Account @${res.user?.username} created successfully! Signing in...`);
      setTimeout(() => {
        onLoginSuccess(res.user!.email, res.user!.role, res.user!.fullName, res.user!.username);
      }, 500);
    } else {
      if (!emailOrUsername.trim() || !password.trim()) {
        setError('Please provide both your email/username and password.');
        return;
      }

      const res = userService.authenticate(emailOrUsername, password, role);
      if (!res.success || !res.user) {
        setError(res.error || 'Invalid credentials.');
        return;
      }

      setSuccessMessage(`Welcome back, ${res.user.fullName}! Loading portal...`);
      setTimeout(() => {
        onLoginSuccess(res.user!.email, role, res.user!.fullName, res.user!.username);
      }, 400);
    }
  };

  const roleName =
    role === 'customer'
      ? 'Customer'
      : role === 'customs-officer'
      ? 'Customs Officer'
      : role === 'freight-agent'
      ? 'Freight Agent'
      : 'System Admin';

  return (
    <div className="w-full min-h-[85vh] flex flex-col items-center justify-center p-3 sm:p-6 my-auto">
      {/* Centered Main Container Card with Side-by-Side Layout */}
      <div className="w-full max-w-5xl bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-md">
        
        {/* LEFT COLUMN: APP HIGHLIGHTS & ARCHITECTURE (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0B132B] via-[#101B3B] to-[#1C2541] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

          {/* Brand Header */}
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-600/30 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white transform -rotate-45 fill-current" />
              </div>
              <div>
                <div className="font-black text-xl tracking-wider text-white uppercase font-sans">
                  FREIGHT HUB
                </div>
                <div className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">
                  ENTERPRISE LOGISTICS INTELLIGENCE
                </div>
              </div>
            </div>

            {/* Feature Highlight Box */}
            <div className="bg-slate-800/60 border border-slate-700/60 backdrop-blur-md rounded-2xl p-4 shadow-xl space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white tracking-tight">
                  Risk & ML Pricing Suite
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Autonomous 5-factor composite risk scoring, real-time marine weather radar, CBIC/DGFT customs validation, and ML gradient boosted freight pricing models.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                  <Calculator className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white block">Multi-Modal Calculation</span>
                  <span className="text-[11px] text-slate-400">Instant Ocean FCL/LCL, Air & Road freight quotations</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white block">Customs Officer Desk</span>
                  <span className="text-[11px] text-slate-400">ICEGATE review, HS code tariff audit & sign-offs</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
                  <CloudRain className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white block">Marine Weather Radar</span>
                  <span className="text-[11px] text-slate-400">Wave height, wind knots & route delay mitigation</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white block">ML Freight Pricing Studio</span>
                  <span className="text-[11px] text-slate-400">Gradient boosted trees ($R^2 = 0.974$) vs rule matrix</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>© FreightHub Enterprise 2026</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
              v3.0.0 Enterprise
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM & 5-PORTAL SELECTOR (7 cols) */}
        <div className="lg:col-span-7 bg-white text-slate-900 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isRegistering ? 'Register Enterprise User' : `Sign In: ${roleName}`}
              </h2>
              <p className="text-xs text-slate-500 italic mt-0.5 font-medium">
                {isRegistering
                  ? 'Self-registration with fixed username and email credentials.'
                  : `Select your portal role below to sign in.`}
              </p>
            </div>

            {/* 4-WAY PORTAL SWITCHER: CUSTOMER, FREIGHT AGENT, CUSTOMS OFFICER, ADMIN */}
            <div className="mb-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                SELECT PORTAL ROLE:
              </label>
              <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-1.5 border border-slate-200">
                {/* 1. Customer (FIRST) */}
                <button
                  type="button"
                  onClick={() => handleRoleChange('customer')}
                  className={`py-2 px-1 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    role === 'customer'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span className="truncate text-[11px]">Customer</span>
                </button>

                {/* 2. Freight Agent */}
                <button
                  type="button"
                  onClick={() => handleRoleChange('freight-agent')}
                  className={`py-2 px-1 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    role === 'freight-agent'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <Anchor className="w-4 h-4" />
                  <span className="truncate text-[11px]">Freight Agent</span>
                </button>

                {/* 3. Customs Officer */}
                <button
                  type="button"
                  onClick={() => handleRoleChange('customs-officer')}
                  className={`py-2 px-1 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    role === 'customs-officer'
                      ? 'bg-amber-500 text-slate-950 shadow-md border border-amber-600/30'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="truncate text-[11px]">Customs Officer</span>
                </button>

                {/* 4. System Admin (LAST) */}
                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className={`py-2 px-1 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    role === 'admin'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span className="truncate text-[11px]">Admin</span>
                </button>
              </div>
            </div>

            {/* Error / Success Notices */}
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {!isRegistering ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      EMAIL OR USERNAME
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                        placeholder="Enter email or username"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-mono font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      PASSWORD
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      FULL NAME *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      USERNAME *
                    </label>
                    <div className="relative">
                      <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                        placeholder="Choose a username"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      EMAIL ADDRESS *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      PASSWORD *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter secure password"
                        className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2 p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all mt-3 cursor-pointer uppercase tracking-wider ${
                  role === 'customer'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                    : role === 'customs-officer'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                    : role === 'freight-agent'
                    ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/30'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                }`}
              >
                <span>
                  {isRegistering
                    ? 'REGISTER CUSTOMER ACCOUNT'
                    : `SIGN IN TO ${roleName.toUpperCase()}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Toggle Register */}
          <div className="mt-3 text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold transition-colors cursor-pointer"
            >
              {isRegistering
                ? 'Already have an account? Sign in here'
                : 'Need a customer account? Click here to register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};