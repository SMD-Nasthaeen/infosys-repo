import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Briefcase,
  ShieldAlert,
  Search,
  Plus,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Edit2,
  Lock,
  Sparkles,
  CheckCircle2,
  X,
  Building2,
  ShieldCheck,
  UserX,
  Trash2,
  Ship,
  Eye,
  EyeOff,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Sliders,
  Globe,
  AlertTriangle,
  Clock,
  RotateCcw,
  FileWarning,
} from 'lucide-react';
import { UserRole } from '../types';
import { userService, UserAccount } from '../services/userService';

const PRESET_DELETION_REASONS = [
  'Terms of service & freight booking policy violation',
  'Duplicate customer profile registration',
  'Account decommission requested directly by user',
  'Commercial tariff dispute / non-payment suspension',
  'Inactive account cleanup policy',
  'Failed KYC verification and regulatory compliance audit',
];

export const AdminUserManagementView: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending_deletion'>('all');
  const [showRoleMatrix, setShowRoleMatrix] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Generator Modal State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorRole, setGeneratorRole] = useState<UserRole>('business');
  const [generatedProfile, setGeneratedProfile] = useState<{
    fullName: string;
    username: string;
    email: string;
    password: string;
    companyName: string;
  } | null>(null);

  // Edit / Create User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('shipper');
  const [formCompany, setFormCompany] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'suspended' | 'pending_deletion'>('active');
  const [formNotes, setFormNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete / Schedule Deactivation Modal State
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserAccount | null>(null);
  const [deletionReasonInput, setDeletionReasonInput] = useState<string>('');
  const [deletionModalError, setDeletionModalError] = useState<string | null>(null);

  // View Reason Modal State
  const [viewReasonUser, setViewReasonUser] = useState<UserAccount | null>(null);

  // Copy notification state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadUsers = () => {
    setUsers(userService.getUsers());
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleOpenDeleteModal = (user: UserAccount) => {
    setDeleteTargetUser(user);
    setDeletionReasonInput('');
    setDeletionModalError(null);
  };

  // Schedule Deactivation with mandatory reason & 24h countdown
  const handleScheduleDeactivation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!deleteTargetUser) return;

    const trimmedReason = deletionReasonInput.trim();
    if (!trimmedReason) {
      setDeletionModalError('Please enter a mandatory reason for deleting this account.');
      return;
    }

    const res = userService.scheduleAccountDeletion(
      deleteTargetUser.id,
      trimmedReason,
      'Admin (admin@freighthub.com)'
    );

    if (res.success) {
      loadUsers();
      showToast(
        `Deactivation notice dispatched to @${deleteTargetUser.username}. The account will be deactivated within 24 hours.`
      );
      setDeleteTargetUser(null);
      setDeletionReasonInput('');
      setDeletionModalError(null);
    } else {
      setDeletionModalError(res.error || 'Failed to schedule deletion.');
    }
  };

  // Cancel deletion & restore to active
  const handleCancelDeactivation = (user: UserAccount) => {
    const res = userService.cancelAccountDeletion(user.id);
    if (res.success) {
      loadUsers();
      showToast(`Account @${user.username} deactivation cancelled and restored to Active status.`);
      if (viewReasonUser?.id === user.id) {
        setViewReasonUser(null);
      }
    } else {
      alert(res.error || 'Failed to cancel deactivation.');
    }
  };

  // Permanent immediate deletion
  const handleImmediatePurge = (user: UserAccount) => {
    const confirmPurge = window.confirm(
      `Are you sure you want to permanently purge @${user.username} immediately? This action cannot be undone.`
    );
    if (!confirmPurge) return;

    const res = userService.deleteUser(user.id);
    if (res.success) {
      loadUsers();
      showToast(`Account @${user.username} was permanently purged.`);
      if (deleteTargetUser?.id === user.id) setDeleteTargetUser(null);
      if (viewReasonUser?.id === user.id) setViewReasonUser(null);
    } else {
      alert(res.error || 'Failed to purge user.');
    }
  };

  const handleGenerateClick = (role: UserRole = 'business') => {
    setGeneratorRole(role);
    const newGen = userService.generateRandomProfile(role);
    setGeneratedProfile(newGen);
    setIsGeneratorOpen(true);
  };

  const handleRegenerate = () => {
    const newGen = userService.generateRandomProfile(generatorRole);
    setGeneratedProfile(newGen);
  };

  const getPortalLabelForRole = (role: UserRole): string => {
    switch (role) {
      case 'shipper':
      case 'user':
        return 'User Portal';
      case 'customer-officer':
      case 'customs-officer':
        return 'Customer Officer Desk';
      case 'business':
      case 'broker':
        return 'Commercial Business Desk';
      case 'freight-agent':
        return 'Freight Agent Operations';
      case 'admin':
        return 'Root Admin Console';
      default:
        return 'FreightHub Portal';
    }
  };

  const handleSaveGeneratedUser = () => {
    if (!generatedProfile) return;

    const res = userService.addUser({
      fullName: generatedProfile.fullName,
      username: generatedProfile.username,
      email: generatedProfile.email,
      password: generatedProfile.password,
      role: generatorRole,
      status: 'active',
      companyName: generatedProfile.companyName,
      generatedBy: 'Admin Generated (admin.root)',
      notes: `System-provisioned ${getPortalLabelForRole(generatorRole)} credentials`,
    });

    if (res.success) {
      loadUsers();
      setIsGeneratorOpen(false);
      showToast(`Provisioned credentials for ${generatedProfile.fullName} (${generatedProfile.username})`);
      // Copy to clipboard
      navigator.clipboard.writeText(
        `FreightHub Login Credentials:\nRole: ${generatorRole.toUpperCase()} (${getPortalLabelForRole(generatorRole)})\nEmail: ${generatedProfile.email}\nUsername: ${generatedProfile.username}\nPassword: ${generatedProfile.password}\nPortal Access: ${getPortalLabelForRole(generatorRole)}`
      );
      setCopiedId('generated');
    } else {
      alert(res.error || 'Failed to save user');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingUserId(null);
    setFormFullName('');
    setFormUsername('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('shipper');
    setFormCompany('');
    setFormStatus('active');
    setFormNotes('');
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUserId(user.id);
    setFormFullName(user.fullName);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormPassword(user.password);
    setFormRole(user.role);
    setFormCompany(user.companyName || '');
    setFormStatus(user.status);
    setFormNotes(user.notes || '');
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (editingUserId) {
      // Update existing account
      const res = userService.updateUser(editingUserId, {
        fullName: formFullName.trim(),
        username: formUsername.trim(),
        email: formEmail.trim(),
        password: formPassword.trim(),
        role: formRole,
        companyName: formCompany.trim(),
        status: formStatus,
        notes: formNotes.trim(),
      });

      if (res.success) {
        loadUsers();
        setIsEditModalOpen(false);
        showToast('Account details and credentials updated successfully');
      } else {
        setModalError(res.error || 'Failed to update user account');
      }
    } else {
      // Create new account
      const res = userService.addUser({
        fullName: formFullName.trim(),
        username: formUsername.trim(),
        email: formEmail.trim(),
        password: formPassword.trim(),
        role: formRole,
        companyName: formCompany.trim(),
        status: formStatus,
        generatedBy: 'Admin Created',
        notes: formNotes.trim(),
      });

      if (res.success) {
        loadUsers();
        setIsEditModalOpen(false);
        showToast(`Account @${formUsername} created successfully for ${getPortalLabelForRole(formRole)}`);
      } else {
        setModalError(res.error || 'Failed to create user account');
      }
    }
  };

  const handleToggleStatus = (user: UserAccount) => {
    const isSuperAdmin =
      user.username === 'admin@freighthub.com' ||
      user.email === 'admin@freighthub.com' ||
      user.username === 'admin.root';

    if (isSuperAdmin) {
      showToast('SuperAdmin root account status cannot be modified.');
      return;
    }

    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    userService.updateUser(user.id, { status: newStatus });
    loadUsers();
    showToast(`Account @${user.username} status set to ${newStatus}`);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetUser) return;
    const res = userService.deleteUser(deleteTargetUser.id);
    if (res.success) {
      loadUsers();
      showToast(`User account @${deleteTargetUser.username} was permanently removed`);
      setDeleteTargetUser(null);
    } else {
      alert(res.error || 'Failed to delete user');
    }
  };

  const handleCopyCredentials = (user: UserAccount) => {
    navigator.clipboard.writeText(
      `FreightHub Login Credentials:\nRole: ${user.role.toUpperCase()} (${getPortalLabelForRole(user.role)})\nEmail: ${user.email}\nUsername: ${user.username}\nPassword: ${user.password}\nPortal Access: ${getPortalLabelForRole(user.role)}`
    );
    setCopiedId(user.id);
    showToast(`Credentials copied for ${user.username} (${getPortalLabelForRole(user.role)})`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const term = (searchTerm || '').toLowerCase().trim();
    // Ensure distinct users by ID
    const uniqueMap = new Map<string, UserAccount>();
    users.forEach((u) => {
      if (u && u.id) {
        uniqueMap.set(u.id, u);
      }
    });

    return Array.from(uniqueMap.values()).filter((u) => {
      const matchesSearch =
        !term ||
        (u.fullName || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.username || '').toLowerCase().includes(term) ||
        (u.companyName || '').toLowerCase().includes(term) ||
        (u.notes || '').toLowerCase().includes(term);

      const matchesRole =
        roleFilter === 'all' ||
        u.role === roleFilter;

      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalCount = (users || []).length;
  const customerCount = (users || []).filter((u) => u && u.role === 'customer').length;
  const officerCount = (users || []).filter((u) => u && u.role === 'customs-officer').length;
  const agentCount = (users || []).filter((u) => u && u.role === 'freight-agent').length;
  const adminCount = (users || []).filter((u) => u && u.role === 'admin').length;
  const activeCount = (users || []).filter((u) => u && u.status === 'active').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & 5-Portal KPI Stat Cards */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-600/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-purple-700 uppercase tracking-widest">
                  5-Tier Access Control & RBAC
                </span>
                <span className="text-[10px] bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                  Full Authority Console
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Enterprise 5-Portal User Directory
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage accounts, role assignments, passwords, and portal authorization across Users, Customer Officers, Business Desk, Freight Agents & System Admins.
              </p>
            </div>
          </div>

          {/* Quick Action Generation Buttons */}
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
            <button
              onClick={() => handleGenerateClick('user')}
              className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Generate a new User account"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Gen User</span>
            </button>
            <button
              onClick={() => handleGenerateClick('customer-officer')}
              className="flex-1 sm:flex-none px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Generate a new Customer Compliance Officer account"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Gen Officer</span>
            </button>
            <button
              onClick={() => handleGenerateClick('business')}
              className="flex-1 sm:flex-none px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Generate a new Commercial Business account"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Gen Business</span>
            </button>
            <button
              onClick={() => handleGenerateClick('freight-agent')}
              className="flex-1 sm:flex-none px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Generate a new Freight Agent Operations account"
            >
              <Ship className="w-3.5 h-3.5" />
              <span>Gen Agent</span>
            </button>
            <button
              onClick={() => handleGenerateClick('admin')}
              className="flex-1 sm:flex-none px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Generate a new Administrator account"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Gen Admin</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Enroll Account</span>
            </button>
          </div>
        </div>

        {/* 6 KPI Metric Badges for the 5 Portals */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
              <span>Total Accounts</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {activeCount} Active
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">{totalCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Enrolled 4-Tier Accounts</div>
          </div>

          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
            <div className="text-[10px] font-bold text-blue-700 uppercase flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Customer Portal
            </div>
            <div className="text-xl font-black text-blue-900 mt-1">{customerCount}</div>
            <div className="text-[10px] text-blue-600 mt-0.5">Tariff & Tracking Portal</div>
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
            <div className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Customs Officer
            </div>
            <div className="text-xl font-black text-amber-900 mt-1">{officerCount}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Compliance & Audit Desk</div>
          </div>

          <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl">
            <div className="text-[10px] font-bold text-teal-700 uppercase flex items-center gap-1">
              <Ship className="w-3 h-3" /> Freight Agents
            </div>
            <div className="text-xl font-black text-teal-900 mt-1">{agentCount}</div>
            <div className="text-[10px] text-teal-600 mt-0.5">Vessel & Fleet Operations</div>
          </div>

          <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl">
            <div className="text-[10px] font-bold text-purple-700 uppercase flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> System Admins
            </div>
            <div className="text-xl font-black text-purple-900 mt-1">{adminCount}</div>
            <div className="text-[10px] text-purple-600 mt-0.5">Root Master Governance</div>
          </div>
        </div>

        {/* 5-Portal Roles & Permissions Guide Toggle */}
        <div className="pt-1">
          <button
            onClick={() => setShowRoleMatrix(!showRoleMatrix)}
            className="text-xs font-bold text-slate-600 hover:text-purple-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-purple-600" />
            <span>{showRoleMatrix ? 'Hide 5-Portal Permission Matrix' : 'View 5-Portal Roles & Authorization Matrix'}</span>
            {showRoleMatrix ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showRoleMatrix && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in duration-200">
              <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-blue-700">
                  <UserCheck className="w-4 h-4" />
                  <span>1. User (Client Portal)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Access to Instant Tariff Engine, Corridor Route Lookup, Live Shipment Tracking, Saved Quotes, and User PDF Invoices.
                </p>
                <div className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Target: /user-portal
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-700">
                  <UserCheck className="w-4 h-4" />
                  <span>2. Customer Officer</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Access to Customer Compliance Audit, HS Code Validation, ICEGATE & Cargo Clearance Sign-offs, and Document Verification.
                </p>
                <div className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Target: /customer-officer-portal
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700">
                  <Briefcase className="w-4 h-4" />
                  <span>3. Business Desk</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Access to Commercial Margin Control, Pricing Spread Tier Governance (Enterprise, Standard, Spot), Commission Ledger & Commercial Approvals.
                </p>
                <div className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Target: /business-portal
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-teal-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-teal-700">
                  <Ship className="w-4 h-4" />
                  <span>4. Freight Agent</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Access to Ocean/Air Carrier Slot Allocations (Maersk, MSC, CMA CGM), Vessel Dispatching, AIS Fleet Tracking & Voyage Route Optimizer.
                </p>
                <div className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                  Target: /freight-agent-portal
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-purple-700">
                  <ShieldAlert className="w-4 h-4" />
                  <span>5. System Admin</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Full control over Master Port/Hub Data, Tariffs & Surcharges (BAF, THC), User Account Provisioning, and RBAC Security Logs.
                </p>
                <div className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  Target: /admin-portal
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, username, company..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Role & Status Switchers */}
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setRoleFilter('customer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  roleFilter === 'customer' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>Customer ({customerCount})</span>
              </button>
              <button
                onClick={() => setRoleFilter('customs-officer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  roleFilter === 'customs-officer' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>Officer ({officerCount})</span>
              </button>
              <button
                onClick={() => setRoleFilter('freight-agent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  roleFilter === 'freight-agent' ? 'bg-teal-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Ship className="w-3 h-3" />
                <span>Agent ({agentCount})</span>
              </button>
              <button
                onClick={() => setRoleFilter('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  roleFilter === 'admin' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Admin ({adminCount})</span>
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none shrink-0"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="pending_deletion">Pending Deactivation (24h)</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">User Profile</th>
                <th className="py-3 px-4">Fixed Email & Username</th>
                <th className="py-3 px-4">Role & Portal Target</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Status & Health</th>
                <th className="py-3 px-4">Enrolled / Origin</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    No user accounts matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSuperAdmin =
                    user.username === 'admin@freighthub.com' ||
                    user.email === 'admin@freighthub.com' ||
                    user.username === 'admin.root';

                  const isPasswordRevealed = !!revealedPasswords[user.id];
                  const isPendingDeletion = user.status === 'pending_deletion';

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors ${
                        isPendingDeletion
                          ? 'bg-red-50/60 hover:bg-red-50/90 border-l-4 border-l-red-500'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Full Name & Role Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0 ${
                              user.role === 'admin'
                                ? 'bg-purple-600'
                                : user.role === 'customs-officer'
                                ? 'bg-amber-600'
                                : user.role === 'freight-agent'
                                ? 'bg-teal-600'
                                : 'bg-blue-600'
                            }`}
                          >
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{user.fullName}</span>
                              {isSuperAdmin && (
                                <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.5 rounded border border-purple-200">
                                  Root Admin
                                </span>
                              )}
                              {isPendingDeletion && (
                                <span className="text-[9px] bg-red-100 text-red-700 font-black px-1.5 py-0.5 rounded border border-red-200 animate-pulse flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>24H DELETION NOTICE</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {user.companyName || 'Standard Client Organization'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Fixed Email & Username */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-slate-800 font-semibold">{user.email}</div>
                        <div className="font-mono text-[11px] text-slate-400 font-medium">@{user.username}</div>
                      </td>

                      {/* Role & Target Portal Badge */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : user.role === 'customs-officer'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : user.role === 'freight-agent'
                                ? 'bg-teal-100 text-teal-900 border border-teal-200'
                                : 'bg-blue-100 text-blue-900 border border-blue-200'
                            }`}
                          >
                            {user.role === 'admin' ? (
                              <ShieldAlert className="w-3 h-3" />
                            ) : user.role === 'customs-officer' ? (
                              <UserCheck className="w-3 h-3 text-amber-700" />
                            ) : user.role === 'freight-agent' ? (
                              <Ship className="w-3 h-3" />
                            ) : (
                              <UserCheck className="w-3 h-3" />
                            )}
                            <span>
                              {user.role === 'customs-officer'
                                ? 'Customs Officer'
                                : user.role === 'freight-agent'
                                ? 'Freight Agent'
                                : user.role === 'admin'
                                ? 'Admin'
                                : 'Customer'}
                            </span>
                          </span>
                          <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <span className="text-slate-400">Portal:</span>
                            <span className="font-semibold text-slate-700">{getPortalLabelForRole(user.role)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Password with Reveal & Copy */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-lg inline-block border border-slate-200">
                            {isPasswordRevealed ? user.password : '••••••••'}
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                            title={isPasswordRevealed ? 'Hide Password' : 'Show Password'}
                          >
                            {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Status Toggle & Deactivation Indicator */}
                      <td className="py-3 px-4">
                        {isPendingDeletion ? (
                          <button
                            type="button"
                            onClick={() => setViewReasonUser(user)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 shadow-sm cursor-pointer transition-all"
                            title="Click to view deletion reason and notice details"
                          >
                            <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                            <span>Deactivation in 24h</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={isSuperAdmin}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                              user.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            } ${isSuperAdmin ? 'opacity-80 cursor-not-allowed' : ''}`}
                            title={isSuperAdmin ? 'Root Admin cannot be suspended' : 'Click to toggle Active / Suspended status'}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                            <span className="capitalize">{user.status}</span>
                          </button>
                        )}
                      </td>

                      {/* Enrolled / Origin */}
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        <div className="font-semibold text-slate-700">{user.generatedBy || 'Self-Registered'}</div>
                        <div className="text-[10px] text-slate-400">{user.createdAt}</div>
                      </td>

                      {/* Full Admin Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If pending deletion, offer View Reason, Restore, and Immediate Purge */}
                          {isPendingDeletion ? (
                            <>
                              <button
                                onClick={() => setViewReasonUser(user)}
                                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                                title="View Deletion Reason & 24h Notice Details"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancelDeactivation(user)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                title="Cancel Deletion & Restore to Active"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleImmediatePurge(user)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                title="Purge Immediately (Permanent Delete)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Copy Credential */}
                              <button
                                onClick={() => handleCopyCredentials(user)}
                                className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                title="Copy login credentials (Role, Portal, Email, Username, Password)"
                              >
                                {copiedId === user.id ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>

                              {/* Full Edit Profile & Password */}
                              <button
                                onClick={() => handleOpenEditModal(user)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit user details, username, email, password, role, and portal"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Delete User Account with Mandatory Reason (24h Notice) */}
                              {!isSuperAdmin && (
                                <button
                                  onClick={() => handleOpenDeleteModal(user)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete account with mandatory reason (24h notice)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GENERATOR MODAL: Profile & Credential Generator for 5 Portals */}
      {isGeneratorOpen && generatedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 text-slate-800 overflow-hidden ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-blue-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    5-Portal Profile & Credential Generator
                  </h3>
                  <p className="text-xs text-slate-500">
                    Auto-provisions fixed username, email, password & portal credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                  Select Target Portal Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratorRole('customer');
                      const p = userService.generateRandomProfile('customer');
                      setGeneratedProfile(p);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                      generatorRole === 'customer'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Customer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGeneratorRole('customs-officer');
                      const p = userService.generateRandomProfile('customs-officer');
                      setGeneratedProfile(p);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                      generatorRole === 'customs-officer'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Officer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGeneratorRole('freight-agent');
                      const p = userService.generateRandomProfile('freight-agent');
                      setGeneratedProfile(p);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                      generatorRole === 'freight-agent'
                        ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Ship className="w-3.5 h-3.5" />
                    <span>Agent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGeneratorRole('admin');
                      const p = userService.generateRandomProfile('admin');
                      setGeneratedProfile(p);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                      generatorRole === 'admin'
                        ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* Target Portal Routing Summary Banner */}
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                <span className="font-bold text-purple-900">Authorized Portal Destination:</span>
                <span className="font-black text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                  {getPortalLabelForRole(generatorRole)}
                </span>
              </div>

              {/* Generated Credential Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 font-mono text-xs border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-sans font-bold border-b border-slate-800 pb-2">
                  <span>Generated Profile Record</span>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerate</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Full Name:</span>
                    <span className="text-white font-bold">{generatedProfile.fullName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Fixed Email:</span>
                    <span className="text-cyan-400 font-bold">{generatedProfile.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Fixed Username:</span>
                    <span className="text-amber-400 font-bold">@{generatedProfile.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Generated Password:</span>
                    <span className="text-emerald-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                      {generatedProfile.password}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Organization:</span>
                    <span className="text-slate-300">{generatedProfile.companyName}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGeneratorOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveGeneratedUser}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <Check className="w-4 h-4" />
                  <span>Enroll & Copy Credentials</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 text-slate-800 overflow-hidden ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 text-white rounded-2xl">
                  {editingUserId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingUserId ? 'Edit Account Credentials & Role' : 'Enroll New 5-Portal Account'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingUserId ? 'Modify credentials, portal assignment, and account status' : 'Define credentials with fixed email & portal access'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveUserForm} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="e.g. Rohit Sharma"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Fixed Username *
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    placeholder="e.g. rohit.officer"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Fixed Email Address *
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. officer@freighthub.in"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Assigned 5-Portal Role *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="user">1. User (Client Portal)</option>
                    <option value="customer-officer">2. Customer Officer (Compliance & Verification Desk)</option>
                    <option value="business">3. Business (Commercial Desk)</option>
                    <option value="freight-agent">4. Freight Agent (Operations Desk)</option>
                    <option value="admin">5. System Administrator (Root)</option>
                  </select>
                </div>
              </div>

              {/* Live Portal Destination Feedback */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Assigned Dashboard:</span>
                <span className="font-black text-slate-900">{getPortalLabelForRole(formRole)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="e.g. Apex Commercial Pricing"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Account Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'suspended')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="active">Active (Access Allowed)</option>
                    <option value="suspended">Suspended (Access Blocked)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Internal Operational Notes
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Commercial Pricing Desk Lead / Key Account Representative"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUserId ? 'Save Account Changes' : 'Create 4-Portal Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE DEACTIVATION / DELETE MODAL WITH MANDATORY REASON */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 text-slate-800 overflow-hidden ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50 via-rose-50 to-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-md shrink-0">
                  <FileWarning className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Delete User Account & Issue 24h Notice
                  </h3>
                  <p className="text-xs text-slate-500">
                    Provide a mandatory reason before scheduling account deactivation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteTargetUser(null);
                  setDeletionModalError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleScheduleDeactivation} className="p-6 space-y-4">
              {/* Target User Info Summary */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{deleteTargetUser.fullName}</span>
                    <span className="font-mono text-slate-500 text-[11px]">(@{deleteTargetUser.username})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{deleteTargetUser.email}</div>
                </div>
                <span className="px-2.5 py-1 bg-white text-purple-700 font-bold rounded-lg border border-purple-200 text-[11px]">
                  {getPortalLabelForRole(deleteTargetUser.role)}
                </span>
              </div>

              {/* 24-Hour Notice Policy Banner */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>24-Hour Notice & Grace Period</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Upon confirmation, the reason message will immediately appear on this user's account banner. The user will have a <strong>24-hour grace period</strong> before access is fully decommissioned.
                </p>
              </div>

              {/* Error Message */}
              {deletionModalError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{deletionModalError}</span>
                </div>
              )}

              {/* Preset Reason Chips */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                  Quick Select Reason Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_DELETION_REASONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDeletionReasonInput(preset);
                        setDeletionModalError(null);
                      }}
                      className={`px-2.5 py-1 text-[11px] rounded-lg border text-left transition-all ${
                        deletionReasonInput === preset
                          ? 'bg-purple-50 text-purple-700 border-purple-300 font-bold shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Mandatory Reason Textarea */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>
                    Reason for Deleting Account <span className="text-red-500 font-bold">*</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {deletionReasonInput.length} characters
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={deletionReasonInput}
                  onChange={(e) => {
                    setDeletionReasonInput(e.target.value);
                    if (deletionModalError) setDeletionModalError(null);
                  }}
                  placeholder="Type the official explanation for account deletion here. This message is dispatched directly to the user's account notice..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetUser(null)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleImmediatePurge(deleteTargetUser)}
                  className="w-full sm:w-auto px-3 py-2.5 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors border border-transparent hover:border-red-200"
                  title="Bypass 24-hour grace and permanently delete right now"
                >
                  Immediate Purge
                </button>
                <button
                  type="submit"
                  disabled={!deletionReasonInput.trim()}
                  className={`w-full sm:flex-1 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                    deletionReasonInput.trim()
                      ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Schedule Deactivation (24h Notice)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DEACTIVATION NOTICE & REASON MODAL */}
      {viewReasonUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 text-slate-800 overflow-hidden ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50 via-rose-50 to-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-md shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    24h Deactivation Notice Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review official reason and deactivation schedule
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewReasonUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Account:</span>
                  <span className="font-bold text-slate-900">
                    {viewReasonUser.fullName} (@{viewReasonUser.username})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-mono text-slate-700">{viewReasonUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Portal Access:</span>
                  <span className="font-semibold text-purple-700">
                    {getPortalLabelForRole(viewReasonUser.role)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-400">Notice Issued:</span>
                  <span className="font-semibold text-slate-800">
                    {viewReasonUser.deletionScheduledAt
                      ? new Date(viewReasonUser.deletionScheduledAt).toLocaleString()
                      : 'Recently'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Deactivation Deadline:</span>
                  <span className="font-bold text-red-600">
                    {viewReasonUser.deactivationDeadline
                      ? new Date(viewReasonUser.deactivationDeadline).toLocaleString()
                      : 'Within 24 Hours'}
                  </span>
                </div>
              </div>

              {/* Official Reason */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Reason Delivered to Account
                </label>
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-medium text-red-900 whitespace-pre-wrap leading-relaxed">
                  "{viewReasonUser.deletionReason || 'Administrative account decommission scheduled.'}"
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleImmediatePurge(viewReasonUser)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors"
                >
                  Purge Immediately
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelDeactivation(viewReasonUser)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore to Active</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
