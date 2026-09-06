import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, UserCheck, ShieldAlert, Briefcase, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';
import { userService } from '../services/userService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string, role: UserRole, fullName?: string, username?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [role, setRole] = useState<UserRole>('customer');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase() || cleanEmail.split('@')[0];
    const cleanFullName = fullName.trim() || cleanUsername;

    // Check / register via userService
    const authRes = userService.authenticate(cleanEmail, password, role);
    if (!authRes.success) {
      // If customer role and not found, register new user
      if (role === 'customer') {
        const addRes = userService.addUser({
          fullName: cleanFullName,
          username: cleanUsername,
          email: cleanEmail,
          password: password.trim(),
          role: 'customer',
          status: 'active',
          generatedBy: 'Self-Registered',
        });
        if (addRes.success && addRes.user) {
          onLoginSuccess(addRes.user.email, addRes.user.role, addRes.user.fullName, addRes.user.username);
          onClose();
          return;
        } else if (addRes.error) {
          setError(addRes.error);
          return;
        }
      } else {
        setError(authRes.error || 'Authentication failed. Freight Agent, Customs Officer & Admin profiles must be generated in Admin Console.');
        return;
      }
    }

    onLoginSuccess(cleanEmail, role, cleanFullName, cleanUsername);
    onClose();
  };

  const getRoleHeaderInfo = () => {
    switch (role) {
      case 'admin':
        return {
          title: 'Admin Control Sign In',
          desc: 'System admin console & tariff control',
          color: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
          btnBg: 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30 text-white',
          icon: <ShieldAlert className="w-5 h-5" />,
          label: 'SYSTEM ADMIN',
        };
      case 'customs-officer':
        return {
          title: 'Customs Officer Sign In',
          desc: 'Document verification, risk flags & compliance',
          color: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
          btnBg: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 text-slate-950',
          icon: <UserCheck className="w-5 h-5" />,
          label: 'CUSTOMS OFFICER',
        };
      case 'freight-agent':
        return {
          title: 'Freight Agent Sign In',
          desc: 'Operations, carrier bidding & route optimization',
          color: 'bg-teal-600/20 text-teal-400 border-teal-500/30',
          btnBg: 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/30 text-white',
          icon: <ShieldCheck className="w-5 h-5" />,
          label: 'FREIGHT AGENT',
        };
      default:
        return {
          title: 'Customer Portal Sign In',
          desc: 'Access real-time tariffs, saved quotes & tracking',
          color: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
          btnBg: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30 text-white',
          icon: <ShieldCheck className="w-5 h-5" />,
          label: 'CUSTOMER',
        };
    }
  };

  const roleInfo = getRoleHeaderInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-[#0F172A] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl text-white overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${roleInfo.color}`}>
              {roleInfo.icon}
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {roleInfo.title}
              </h3>
              <p className="text-xs text-slate-400">
                {roleInfo.desc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selection Option */}
        <div className="p-6 pb-2">
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
            SELECT ACCESS ROLE:
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => handleRoleChange('customer')}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === 'customer'
                  ? 'bg-blue-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('freight-agent')}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === 'freight-agent'
                  ? 'bg-teal-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Freight Agent</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('customs-officer')}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === 'customs-officer'
                  ? 'bg-amber-600 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Customs Officer</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === 'admin'
                  ? 'bg-purple-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-300">FIXED USERNAME / NAME</label>
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className={`w-full bg-slate-900 border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none ${
                  role === 'admin'
                    ? 'border-purple-800 focus:border-purple-500'
                    : role === 'customs-officer'
                    ? 'border-amber-700 focus:border-amber-500'
                    : role === 'freight-agent'
                    ? 'border-teal-700 focus:border-teal-500'
                    : 'border-slate-700 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-300">FIXED EMAIL ADDRESS</label>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
                className={`w-full bg-slate-900 border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none ${
                  role === 'admin'
                    ? 'border-purple-800 focus:border-purple-500'
                    : role === 'customs-officer'
                    ? 'border-amber-700 focus:border-amber-500'
                    : role === 'freight-agent'
                    ? 'border-teal-700 focus:border-teal-500'
                    : 'border-slate-700 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-300">PASSWORD</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className={`w-full bg-slate-900 border rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none ${
                  role === 'admin'
                    ? 'border-purple-800 focus:border-purple-500'
                    : role === 'customs-officer'
                    ? 'border-amber-700 focus:border-amber-500'
                    : role === 'freight-agent'
                    ? 'border-teal-700 focus:border-teal-500'
                    : 'border-slate-700 focus:border-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-white rounded transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 mt-4 cursor-pointer ${roleInfo.btnBg}`}
          >
            <span>{`SIGN IN AS ${roleInfo.label}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
