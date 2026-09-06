import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  Mail,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { UserAccount } from '../services/userService';

interface AccountDeactivationNoticeProps {
  currentUser: UserAccount;
  onClose?: () => void;
}

export const AccountDeactivationNotice: React.FC<AccountDeactivationNoticeProps> = ({
  currentUser,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [timeRemainingText, setTimeRemainingText] = useState<string>('Within 24 Hours');

  // Compute countdown timer towards 24h deadline
  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!currentUser.deactivationDeadline) {
        setTimeRemainingText('Within 24 Hours');
        return;
      }

      const deadline = new Date(currentUser.deactivationDeadline).getTime();
      const now = Date.now();
      const diffMs = deadline - now;

      if (diffMs <= 0) {
        setTimeRemainingText('Deactivation imminent (24h period elapsed)');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeRemainingText(`${hours}h ${minutes}m ${seconds}s remaining`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [currentUser.deactivationDeadline]);

  if (currentUser.status !== 'pending_deletion') {
    return null;
  }

  const handleCopySupport = () => {
    navigator.clipboard.writeText('admin@freighthub.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const formattedScheduledAt = currentUser.deletionScheduledAt
    ? new Date(currentUser.deletionScheduledAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Recently';

  const formattedDeadline = currentUser.deactivationDeadline
    ? new Date(currentUser.deactivationDeadline).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Within 24 Hours';

  return (
    <div className="w-full bg-gradient-to-r from-red-950 via-rose-900 to-amber-950 text-white border-b-2 border-red-500 shadow-2xl relative z-40 animate-in fade-in slide-in-from-top-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        {/* Main Alert Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/90 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-600/40 animate-pulse border border-red-400/50">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-red-500/30 text-red-200 border border-red-400/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ACTION REQUIRED
                </span>
                <span className="text-xs font-bold text-red-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                  <span>Deactivation Deadline: <strong className="text-white">{timeRemainingText}</strong></span>
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight mt-0.5">
                This account will be deactivated within 24 hours.
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              type="button"
              onClick={handleCopySupport}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Copy Administrator support email"
            >
              {copiedEmail ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Mail className="w-3.5 h-3.5 text-red-200" />}
              <span>{copiedEmail ? 'Email Copied!' : 'Contact Admin Desk'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 bg-black/20 hover:bg-black/30 text-red-200 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse Deletion Details' : 'Expand Deletion Details'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Detailed Reason & Audit Box (Expandable) */}
        {isExpanded && (
          <div className="mt-3.5 pt-3.5 border-t border-red-500/30 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
            {/* Reason Message from Admin */}
            <div className="md:col-span-8 bg-black/40 border border-red-500/40 rounded-2xl p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-red-300 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span>Official Reason from Administrator</span>
                </span>
                <span className="text-slate-400 lowercase font-mono">by {currentUser.deletionInitiatedBy || 'System Admin'}</span>
              </div>

              <div className="bg-red-950/60 rounded-xl p-3 border border-red-500/30 text-xs sm:text-sm font-semibold text-white leading-relaxed whitespace-pre-wrap">
                "{currentUser.deletionReason || 'Administrative account decommissioning scheduled.'}"
              </div>

              <p className="text-[11px] text-red-200/90 leading-tight">
                All saved routes, quotation history, and user authentication tokens for <strong>@{currentUser.username}</strong> ({currentUser.email}) will become inaccessible after the 24-hour grace period expires on <span className="font-bold text-amber-200">{formattedDeadline}</span>.
              </p>
            </div>

            {/* Timestamps & Dispute Instructions */}
            <div className="md:col-span-4 bg-black/30 border border-red-500/30 rounded-2xl p-3.5 space-y-2.5 text-xs">
              <div className="text-[11px] font-bold text-red-300 uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-300" />
                <span>Notice Information</span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-red-200">
                  <span className="text-slate-400">Notice Issued:</span>
                  <span className="font-bold text-white">{formattedScheduledAt}</span>
                </div>
                <div className="flex items-center justify-between text-red-200">
                  <span className="text-slate-400">Effective By:</span>
                  <span className="font-bold text-amber-300">{formattedDeadline}</span>
                </div>
                <div className="flex items-center justify-between text-red-200">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-extrabold text-red-400 uppercase">Pending Deactivation</span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-red-500/20 text-[10px] text-slate-300 leading-normal">
                If you believe this deactivation notice was triggered in error, please quote reference <span className="font-mono font-bold text-white">ID: {currentUser.id}</span> when contacting <span className="text-cyan-300 font-bold">admin@freighthub.com</span>.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
