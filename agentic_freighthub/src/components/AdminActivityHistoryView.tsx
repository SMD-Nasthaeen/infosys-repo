import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Eye,
  RefreshCw,
  Filter,
  Search,
  ArrowRight,
  Package,
  AlertCircle,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react';

interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  companyName?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface SelectedQuote {
  selectedQuoteId: string;
  quoteId: string;
  customerId: string;
  customerEmail: string;
  companyName: string;
  companyId: string;
  originCode: string;
  destinationCode: string;
  transportMode: string;
  tariffAmount: number;
  currency: string;
  status: string;
  agentRemarks: string;
  reviewedBy: string;
  reviewedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityRecord {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  status: 'success' | 'pending' | 'rejected';
  quoteId?: string;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'customer': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Customer' },
  'user': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Customer' },
  'freight-agent': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Freight Agent' },
  'customs-officer': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Customs Officer' },
  'admin': { bg: 'bg-red-100', text: 'text-red-700', label: 'Admin' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'SELECTED': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'UNDER_REVIEW': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'CUSTOMS_APPROVED': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'BOOKED': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'REJECTED': { bg: 'bg-red-100', text: 'text-red-700' },
};

export const AdminActivityHistoryView: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<SelectedQuote[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch users
      const usersRes = await fetch('/api/auth/users', { headers });
      const usersResult = await usersRes.json();
      if (usersResult.success) {
        setUsers(usersResult.data || []);
      }

      // Fetch selected quotes
      const quotesRes = await fetch('/api/selected-quotes', { headers });
      const quotesResult = await quotesRes.json();
      if (quotesResult.success) {
        setSelectedQuotes(quotesResult.data || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  // Build activity timeline from data
  useEffect(() => {
    const allActivities: ActivityRecord[] = [];

    // Selected quotes as activities
    selectedQuotes.forEach(sq => {
      // Customer selected
      allActivities.push({
        id: `sel-${sq.selectedQuoteId}`,
        timestamp: sq.createdAt,
        actorEmail: sq.customerEmail,
        actorName: sq.customerEmail.split('@')[0],
        actorRole: 'customer',
        action: 'QUOTE_SELECTED',
        details: `Selected quote ${sq.quoteId} for ${sq.originCode} → ${sq.destinationCode} (${sq.currency} ${sq.tariffAmount?.toLocaleString()})`,
        status: 'success',
        quoteId: sq.quoteId,
      });

      // Agent reviewed
      if (sq.reviewedBy && sq.status !== 'SELECTED') {
        allActivities.push({
          id: `rev-${sq.selectedQuoteId}`,
          timestamp: sq.reviewedAt || sq.updatedAt,
          actorEmail: sq.reviewedBy,
          actorName: sq.reviewedBy.split('@')[0],
          actorRole: 'freight-agent',
          action: 'QUOTE_REVIEWED',
          details: `Reviewed quote ${sq.quoteId} - ${sq.status === 'UNDER_REVIEW' ? 'Under Review' : sq.status}${sq.agentRemarks ? ` (${sq.agentRemarks})` : ''}`,
          status: sq.status === 'REJECTED' ? 'rejected' : 'success',
          quoteId: sq.quoteId,
        });
      }

      // Customs action
      if (sq.status === 'CUSTOMS_APPROVED' || sq.status === 'REJECTED') {
        allActivities.push({
          id: `cus-${sq.selectedQuoteId}`,
          timestamp: sq.updatedAt,
          actorEmail: 'customer.officer@freighthub.in',
          actorName: 'Customs Officer',
          actorRole: 'customs-officer',
          action: sq.status === 'CUSTOMS_APPROVED' ? 'CUSTOMS_APPROVED' : 'CUSTOMS_REJECTED',
          details: `Customs ${sq.status === 'CUSTOMS_APPROVED' ? 'approved' : 'rejected'} quote ${sq.quoteId}${sq.agentRemarks ? ` - ${sq.agentRemarks}` : ''}`,
          status: sq.status === 'CUSTOMS_APPROVED' ? 'success' : 'rejected',
          quoteId: sq.quoteId,
        });
      }
    });

    // Add user registration activities
    users.forEach(u => {
      allActivities.push({
        id: `usr-${u.id}`,
        timestamp: u.createdAt,
        actorEmail: u.email,
        actorName: u.fullName || u.email.split('@')[0],
        actorRole: u.role,
        action: 'USER_REGISTERED',
        details: `Account created (${ROLE_COLORS[u.role]?.label || u.role})`,
        status: u.status === 'active' ? 'success' : 'pending',
      });

      if (u.lastLoginAt) {
        allActivities.push({
          id: `login-${u.id}`,
          timestamp: u.lastLoginAt,
          actorEmail: u.email,
          actorName: u.fullName || u.email.split('@')[0],
          actorRole: u.role,
          action: 'USER_LOGIN',
          details: `Last login`,
          status: 'success',
        });
      }
    });

    // Sort by timestamp descending
    allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivities(allActivities);
  }, [selectedQuotes, users]);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter activities
  const filteredActivities = activities.filter(a => {
    if (filterRole !== 'all' && a.actorRole !== filterRole) return false;
    if (filterAction !== 'all' && a.action !== filterAction) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.actorEmail.toLowerCase().includes(q) && !a.details.toLowerCase().includes(q) && !a.quoteId?.toLowerCase().includes(q)) return false;
    }
    if (selectedUser && a.actorEmail !== selectedUser.email) return false;
    return true;
  });

  // Stats
  const totalUsers = users.length;
  const customers = users.filter(u => u.role === 'customer' || u.role === 'user').length;
  const agents = users.filter(u => u.role === 'freight-agent').length;
  const officers = users.filter(u => u.role === 'customs-officer').length;
  const totalQuotes = selectedQuotes.length;
  const approvedQuotes = selectedQuotes.filter(q => q.status === 'CUSTOMS_APPROVED' || q.status === 'BOOKED').length;
  const rejectedQuotes = selectedQuotes.filter(q => q.status === 'REJECTED').length;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'QUOTE_SELECTED': return <Package className="w-4 h-4 text-blue-500" />;
      case 'QUOTE_REVIEWED': return <Eye className="w-4 h-4 text-purple-500" />;
      case 'CUSTOMS_APPROVED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'CUSTOMS_REJECTED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'USER_REGISTERED': return <UserCheck className="w-4 h-4 text-blue-500" />;
      case 'USER_LOGIN': return <Activity className="w-4 h-4 text-green-500" />;
      case 'DOCUMENT_UPLOADED': return <Upload className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'QUOTE_SELECTED': return 'Selected Quote';
      case 'QUOTE_REVIEWED': return 'Reviewed Quote';
      case 'CUSTOMS_APPROVED': return 'Customs Approved';
      case 'CUSTOMS_REJECTED': return 'Customs Rejected';
      case 'USER_REGISTERED': return 'User Registered';
      case 'USER_LOGIN': return 'User Login';
      case 'DOCUMENT_UPLOADED': return 'Document Uploaded';
      default: return action;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        <span className="ml-3 text-sm text-slate-500">Loading activity history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-black">Activity History</h2>
        </div>
        <p className="text-sm text-slate-300">Complete timeline of all customer, agent, and customs officer actions across the platform.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
          <Users className="w-5 h-5 text-slate-400 mx-auto mb-1" />
          <p className="text-2xl font-black text-slate-900">{totalUsers}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Total Users</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
          <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1"><span className="text-blue-600 text-xs font-black">C</span></div>
          <p className="text-2xl font-black text-blue-600">{customers}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Customers</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
          <div className="w-5 h-5 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-1"><span className="text-purple-600 text-xs font-black">A</span></div>
          <p className="text-2xl font-black text-purple-600">{agents}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Agents</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
          <div className="w-5 h-5 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-1"><span className="text-amber-600 text-xs font-black">O</span></div>
          <p className="text-2xl font-black text-amber-600">{officers}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Officers</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
          <Package className="w-5 h-5 text-slate-400 mx-auto mb-1" />
          <p className="text-2xl font-black text-slate-900">{totalQuotes}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Total Quotes</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-black text-emerald-600">{approvedQuotes}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Approved</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
          <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-black text-red-600">{rejectedQuotes}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Rejected</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: User List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">All Users</h3>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto">
            <button
              onClick={() => setSelectedUser(null)}
              className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${!selectedUser ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">All Users</span>
              </div>
              <span className="text-[10px] text-slate-400 ml-6">{activities.length} activities</span>
            </button>
            {users.map(user => {
              const cfg = ROLE_COLORS[user.role] || { bg: 'bg-slate-100', text: 'text-slate-700', label: user.role };
              const userActivities = activities.filter(a => a.actorEmail === user.email).length;
              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(selectedUser?.email === user.email ? null : user)}
                  className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${selectedUser?.email === user.email ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${cfg.bg} ${cfg.text} shrink-0`}>
                        {(user.fullName || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{user.fullName || user.email.split('@')[0]}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${cfg.bg} ${cfg.text} shrink-0`}>
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">{userActivities} activities</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Activity Timeline */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activities..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="user">Customer</option>
              <option value="freight-agent">Freight Agent</option>
              <option value="customs-officer">Customs Officer</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              <option value="QUOTE_SELECTED">Quote Selected</option>
              <option value="QUOTE_REVIEWED">Quote Reviewed</option>
              <option value="CUSTOMS_APPROVED">Customs Approved</option>
              <option value="CUSTOMS_REJECTED">Customs Rejected</option>
              <option value="USER_REGISTERED">User Registered</option>
              <option value="USER_LOGIN">User Login</option>
            </select>
            <button
              onClick={fetchData}
              className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {selectedUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${ROLE_COLORS[selectedUser.role]?.bg || 'bg-slate-100'} ${ROLE_COLORS[selectedUser.role]?.text || 'text-slate-700'}`}>
                  {(selectedUser.fullName || selectedUser.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">{selectedUser.fullName || selectedUser.email}</p>
                  <p className="text-[10px] text-blue-600">{selectedUser.email} · {ROLE_COLORS[selectedUser.role]?.label || selectedUser.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-blue-400 hover:text-blue-600">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">No activities found</p>
                <p className="text-xs text-slate-400">Try adjusting your filters</p>
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const roleCfg = ROLE_COLORS[activity.actorRole] || { bg: 'bg-slate-100', text: 'text-slate-700', label: activity.actorRole };
                return (
                  <div key={activity.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getActionIcon(activity.action)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900">{activity.actorName}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${roleCfg.bg} ${roleCfg.text}`}>{roleCfg.label}</span>
                          <span className="text-[10px] text-slate-400">·</span>
                          <span className="text-[10px] font-bold text-slate-500">{getActionLabel(activity.action)}</span>
                          {activity.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          {activity.status === 'rejected' && <XCircle className="w-3 h-3 text-red-500" />}
                          {activity.status === 'pending' && <Clock className="w-3 h-3 text-amber-500" />}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{activity.details}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-slate-400">{new Date(activity.timestamp).toLocaleString()}</span>
                          {activity.quoteId && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{activity.quoteId}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {filteredActivities.length > 0 && (
            <p className="text-center text-[10px] text-slate-400">Showing {filteredActivities.length} of {activities.length} activities</p>
          )}
        </div>
      </div>
    </div>
  );
};
