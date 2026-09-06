import { UserRole } from '../types';

export interface UserAccount {
  id: string;
  fullName: string;
  username: string; // Fixed, normalized alphanumeric lowercase
  email: string; // Fixed, normalized email
  password: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending_deletion';
  createdAt: string;
  lastLoginAt?: string;
  companyName?: string;
  generatedBy?: string; // 'Self-Registered' | 'Admin Generated'
  phone?: string;
  notes?: string;
  deletionReason?: string;
  deletionScheduledAt?: string;
  deactivationDeadline?: string;
  deletionInitiatedBy?: string;
}

const STORAGE_KEY = 'freighthub_registered_users_v5';

export const INITIAL_SEEDED_USERS: UserAccount[] = [
  {
    id: 'USR-001',
    fullName: 'Aparajita De',
    username: 'aparajita',
    email: 'aparajita@freighthub.in',
    password: 'user123',
    role: 'user',
    status: 'active',
    createdAt: '2026-08-01',
    lastLoginAt: '2026-08-17 08:30',
    companyName: 'ABC Logistics Corp',
    generatedBy: 'Self-Registered',
    phone: '+91 98765 43210',
    notes: 'Primary freight user enterprise account',
  },
  {
    id: 'USR-002',
    fullName: 'Rohit Sharma (Commercial Lead)',
    username: 'rohit.business',
    email: 'business@freighthub.in',
    password: 'business123',
    role: 'business',
    status: 'active',
    createdAt: '2026-07-15',
    lastLoginAt: '2026-08-16 18:45',
    companyName: 'Apex Commercial Pricing Ltd',
    generatedBy: 'Admin Generated (admin@freighthub.com)',
    phone: '+91 98111 22334',
    notes: 'Commercial pricing desk, margin governance & user quote approvals',
  },
  {
    id: 'USR-003',
    fullName: 'Priya Nair (Freight Agent Lead)',
    username: 'priya.agent',
    email: 'agent@freighthub.in',
    password: 'agent123',
    role: 'freight-agent',
    status: 'active',
    createdAt: '2026-07-20',
    lastLoginAt: '2026-08-15 14:10',
    companyName: 'FreightHub Field Dispatch Desk',
    generatedBy: 'Admin Generated (admin@freighthub.com)',
    phone: '+91 98222 33445',
    notes: 'Vessel tracking, carrier spot bidding, route optimizer and port dispatch',
  },
  {
    id: 'USR-004',
    fullName: 'Michael Chang',
    username: 'mchang.global',
    email: 'm.chang@pacificlogistics.com',
    password: 'user456',
    role: 'user',
    status: 'active',
    createdAt: '2026-08-10',
    lastLoginAt: '2026-08-14 11:20',
    companyName: 'Pacific Maritime Corp',
    generatedBy: 'Self-Registered',
    phone: '+65 6789 0123',
    notes: 'LCL & FCL regular user customer',
  },
  {
    id: 'USR-005',
    fullName: 'System Administrator Root',
    username: 'admin@freighthub.com',
    email: 'admin@freighthub.com',
    password: 'admin1234',
    role: 'admin',
    status: 'active',
    createdAt: '2026-06-01',
    lastLoginAt: '2026-08-17 08:00',
    companyName: 'FreightHub Global Core',
    generatedBy: 'System SuperAdmin',
    phone: '+1 (800) 555-0199',
    notes: 'Superuser with full master data, tariff, and user management authority across all portals',
  },
  {
    id: 'USR-006',
    fullName: 'Rajesh Varma (Customer Officer)',
    username: 'rajesh.officer',
    email: 'customer.officer@freighthub.in',
    password: 'officer123',
    role: 'customer-officer',
    status: 'active',
    createdAt: '2026-08-01',
    lastLoginAt: '2026-08-25 09:15',
    companyName: 'FreightHub Compliance & Customer Operations Desk',
    generatedBy: 'System SuperAdmin',
    phone: '+91 98450 11223',
    notes: 'Authorized customer officer for compliance validation, document audit, and quote sign-off',
  },
];

export const userService = {
  getUsers(): UserAccount[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let userList: UserAccount[] = [];

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          userList = parsed.map((u: any) => {
            let normalizedRole: UserRole = u.role;
            // Normalize old role names to new ones
            if (u.role === 'shipper' || u.role === 'user') normalizedRole = 'customer';
            if (u.role === 'broker' || u.role === 'business') normalizedRole = 'freight-agent';
            if (u.role === 'customer-officer') normalizedRole = 'customs-officer';
            return {
              ...u,
              id: u.id || `USR-${String(Date.now()).slice(-6)}`,
              fullName: u.fullName || 'User',
              username: (u.username || '').trim().toLowerCase() || `user.${u.id || Date.now()}`,
              email: (u.email || '').trim().toLowerCase() || `user.${u.id || Date.now()}@freighthub.in`,
              role: normalizedRole,
              status: u.status || 'active',
            };
          });
        }
      }

      // Merge initial seeded accounts ensuring no duplicates by ID, email, or username
      const userMap = new Map<string, UserAccount>();

      // First add initial seeded users
      INITIAL_SEEDED_USERS.forEach((seedUser) => {
        userMap.set(seedUser.id, {
          ...seedUser,
          email: (seedUser.email || '').trim().toLowerCase(),
          username: (seedUser.username || '').trim().toLowerCase(),
        });
      });

      // Overlay userList entries
      userList.forEach((u) => {
        if (!u.id) return;
        const normalizedEmail = (u.email || '').trim().toLowerCase();
        const normalizedUsername = (u.username || '').trim().toLowerCase();

        // If an entry already exists with same seed ID or same email, update it cleanly
        const existingById = userMap.get(u.id);
        if (existingById) {
          userMap.set(u.id, { ...existingById, ...u });
        } else {
          // Check if there is already a user with this email or username
          const existingWithEmail = Array.from(userMap.values()).find(
            (existing) =>
              (existing.email && existing.email.toLowerCase() === normalizedEmail) ||
              (existing.username && existing.username.toLowerCase() === normalizedUsername)
          );
          if (existingWithEmail) {
            userMap.set(existingWithEmail.id, { ...existingWithEmail, ...u, id: existingWithEmail.id });
          } else {
            userMap.set(u.id, u);
          }
        }
      });

      const finalUsers = Array.from(userMap.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalUsers));
      return finalUsers;
    } catch {
      return INITIAL_SEEDED_USERS;
    }
  },

  saveUsers(users: UserAccount[]): void {
    try {
      // Deduplicate by ID before saving
      const map = new Map<string, UserAccount>();
      users.forEach((u) => {
        if (u && u.id) {
          map.set(u.id, u);
        }
      });
      const uniqueUsers = Array.from(map.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueUsers));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  },

  addUser(user: Omit<UserAccount, 'id' | 'createdAt'>): { success: boolean; user?: UserAccount; error?: string } {
    const users = this.getUsers();

    const cleanEmail = (user.email || '').trim().toLowerCase();
    const cleanUsername = (user.username || '').trim().toLowerCase();

    // Validate fixed email pattern
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Please provide a valid, fixed email address (e.g. name@domain.com).' };
    }

    // Validate fixed username pattern (alphanumeric, dots, hyphens, min 3 chars)
    if (!cleanUsername || cleanUsername.length < 3 || !/^[a-z0-9._-]+$/i.test(cleanUsername)) {
      return { success: false, error: 'Username must be at least 3 characters and contain only letters, numbers, dots, or hyphens.' };
    }

    // Check duplicate
    const existing = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanEmail) ||
        (u.username && u.username.toLowerCase() === cleanUsername)
    );

    if (existing) {
      if (existing.email && existing.email.toLowerCase() === cleanEmail) {
        return { success: false, error: `An account with email "${cleanEmail}" is already registered.` };
      }
      return { success: false, error: `The username "${cleanUsername}" is already taken. Please choose another.` };
    }

    const newUser: UserAccount = {
      ...user,
      id: `USR-${String(Date.now()).slice(-6)}`,
      email: cleanEmail,
      username: cleanUsername,
      createdAt: new Date().toISOString().split('T')[0],
      status: user.status || 'active',
    };

    const updated = [newUser, ...users.filter((u) => u.id !== newUser.id)];
    this.saveUsers(updated);
    return { success: true, user: newUser };
  },

  registerUser(user: Omit<UserAccount, 'id' | 'createdAt'>): { success: boolean; user?: UserAccount; error?: string } {
    // Only 'customer' role is permitted for self-registration
    // All other roles (freight-agent, customs-officer, admin) MUST be enrolled via the Admin Portal
    if (user.role !== 'customer') {
      return {
        success: false,
        error: 'Self-registration is only allowed for Customer accounts. All freight agent, customs officer, and admin accounts must be created and verified via the Admin Portal.',
      };
    }
    return this.addUser({
      ...user,
      role: 'customer',
      generatedBy: 'Self-Registered',
    });
  },

  updateUser(id: string, updates: Partial<UserAccount>): { success: boolean; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return { success: false, error: 'User not found.' };
    }

    // If updating email or username, check for collisions with other users
    if (updates.email) {
      const cleanEmail = (updates.email || '').trim().toLowerCase();
      const duplicate = users.find((u) => u.id !== id && (u.email || '').toLowerCase() === cleanEmail);
      if (duplicate) {
        return { success: false, error: `Email "${cleanEmail}" is already in use by another account.` };
      }
      updates.email = cleanEmail;
    }

    if (updates.username) {
      const cleanUsername = (updates.username || '').trim().toLowerCase();
      const duplicate = users.find((u) => u.id !== id && (u.username || '').toLowerCase() === cleanUsername);
      if (duplicate) {
        return { success: false, error: `Username "${cleanUsername}" is already in use by another account.` };
      }
      updates.username = cleanUsername;
    }

    users[index] = { ...users[index], ...updates };
    this.saveUsers(users);
    return { success: true };
  },

  getUserById(id: string): UserAccount | undefined {
    return this.getUsers().find((u) => u.id === id);
  },

  getUserByEmailOrUsername(term: string): UserAccount | undefined {
    const cleanTerm = (term || '').trim().toLowerCase();
    return this.getUsers().find(
      (u) => (u.email || '').toLowerCase() === cleanTerm || (u.username || '').toLowerCase() === cleanTerm
    );
  },

  // Schedules an account for deactivation within 24 hours with a mandatory reason from Admin
  scheduleAccountDeletion(
    id: string,
    reason: string,
    adminIdentifier?: string
  ): { success: boolean; user?: UserAccount; error?: string } {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      return { success: false, error: 'A mandatory reason for account deletion must be provided.' };
    }

    const users = this.getUsers();
    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) {
      return { success: false, error: 'User account not found.' };
    }

    if (
      targetUser.username === 'admin@freighthub.com' ||
      targetUser.email === 'admin@freighthub.com' ||
      targetUser.username === 'admin.root'
    ) {
      return { success: false, error: 'System Administrator Root account (admin@freighthub.com) cannot be deleted.' };
    }

    const now = new Date();
    const scheduledAt = now.toISOString();
    // 24 hours deactivation deadline
    const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const updatedUser: UserAccount = {
      ...targetUser,
      status: 'pending_deletion',
      deletionReason: trimmedReason,
      deletionScheduledAt: scheduledAt,
      deactivationDeadline: deadline,
      deletionInitiatedBy: adminIdentifier || 'System Administrator',
    };

    const index = users.findIndex((u) => u.id === id);
    users[index] = updatedUser;
    this.saveUsers(users);

    return { success: true, user: updatedUser };
  },

  // Cancel deletion & restore account to active
  cancelAccountDeletion(id: string): { success: boolean; user?: UserAccount; error?: string } {
    const users = this.getUsers();
    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) {
      return { success: false, error: 'User account not found.' };
    }

    const updatedUser: UserAccount = {
      ...targetUser,
      status: 'active',
      deletionReason: undefined,
      deletionScheduledAt: undefined,
      deactivationDeadline: undefined,
      deletionInitiatedBy: undefined,
    };

    const index = users.findIndex((u) => u.id === id);
    users[index] = updatedUser;
    this.saveUsers(users);

    return { success: true, user: updatedUser };
  },

  // Permanent immediate purge
  deleteUser(id: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const targetUser = users.find((u) => u.id === id);
    // Do not allow deleting superadmin root account
    if (
      targetUser?.username === 'admin@freighthub.com' ||
      targetUser?.email === 'admin@freighthub.com' ||
      targetUser?.username === 'admin.root'
    ) {
      return { success: false, error: 'System Administrator Root account (admin@freighthub.com) cannot be deleted.' };
    }
    const filtered = users.filter((u) => u.id !== id);
    this.saveUsers(filtered);
    return { success: true };
  },

  authenticate(emailOrUsername: string, password: string, role: UserRole): { success: boolean; user?: UserAccount; error?: string } {
    const users = this.getUsers();
    const term = (emailOrUsername || '').trim().toLowerCase();

    const matchedUser = users.find((u) => {
      // Direct role match only
      if (u.role !== role) return false;
      const emailMatch = (u.email || '').toLowerCase() === term;
      const usernameMatch = (u.username || '').toLowerCase() === term;
      if (role === 'admin' && (term === 'admin' || term === 'admin.root' || term === 'admin@freighthub.com')) {
        return (u.email || '').toLowerCase() === 'admin@freighthub.com' || (u.username || '').toLowerCase() === 'admin@freighthub.com' || (u.username || '').toLowerCase() === 'admin.root';
      }
      return emailMatch || usernameMatch;
    });

    if (!matchedUser) {
      const displayRoleLabel = role.toUpperCase();
      return {
        success: false,
        error: `No registered ${displayRoleLabel} account found with credentials "${emailOrUsername}". Please ensure this account has been verified and provisioned from the Admin Portal.`,
      };
    }

    if (matchedUser.status === 'suspended') {
      return {
        success: false,
        error: 'This account has been suspended by the System Administrator. Please contact support.',
      };
    }

    if (matchedUser.password !== password.trim()) {
      return {
        success: false,
        error: 'Incorrect password. Please verify your password and try again.',
      };
    }

    // Record last login
    const now = new Date();
    const nowStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    this.updateUser(matchedUser.id, { lastLoginAt: nowStr });

    return { success: true, user: matchedUser };
  },

  generateRandomProfile(role: UserRole, companyPrefix?: string, personName?: string): {
    fullName: string;
    username: string;
    email: string;
    password: string;
    companyName: string;
  } {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generatedPass = '';
    for (let i = 0; i < 10; i++) {
      generatedPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    let fullName = personName || '';
    let username = '';
    let email = '';
    let company = companyPrefix || '';

    if (role === 'admin') {
      fullName = fullName || `Admin Controller ${randomDigits}`;
      username = `admin.ops${randomDigits}`;
      email = `ops.${randomDigits}@freighthub.com`;
      company = company || 'FreightHub Global Headquarters';
    } else if (role === 'customs-officer') {
      const officerNames = ['Rajesh Varma', 'Anand Swaminathan', 'Sunita Deshmukh', 'Vikramaditya Bose', 'Kavita Menon'];
      fullName = fullName || officerNames[Math.floor(Math.random() * officerNames.length)];
      const prefix = fullName.toLowerCase().replace(/[^a-z0-9]/g, '.');
      username = `${prefix}.officer${Math.floor(Math.random() * 90 + 10)}`;
      email = `${prefix}${randomDigits}@freighthub.in`;
      company = company || 'Customer Operations & Compliance Desk';
    } else if (role === 'freight-agent') {
      const agentNames = ['Priya Nair', 'Karan Singh', 'Sunita Rao', 'Rajesh Kumar', 'Deepak Joshi'];
      fullName = fullName || agentNames[Math.floor(Math.random() * agentNames.length)];
      const prefix = fullName.toLowerCase().replace(/[^a-z0-9]/g, '.');
      username = `${prefix}.agent${Math.floor(Math.random() * 90 + 10)}`;
      email = `${prefix}${randomDigits}@freighthub.in`;
      company = company || 'FreightHub Field Dispatch Desk';
    } else {
      const customerNames = ['Aparajita De', 'Michael Chang', 'Rajesh Mehta', 'Ananya Gupta', 'Rohan Das'];
      fullName = fullName || customerNames[Math.floor(Math.random() * customerNames.length)];
      const prefix = fullName.toLowerCase().replace(/[^a-z0-9]/g, '.');
      username = `${prefix}${Math.floor(Math.random() * 900 + 100)}`;
      email = `${prefix}${randomDigits}@oceanfreight.in`;
      company = company || 'Global Trade Enterprises';
    }

    return {
      fullName,
      username,
      email,
      password: generatedPass,
      companyName: company,
    };
  },

  isDeactivated(emailOrUsername: string): boolean {
    if (!emailOrUsername) return false;
    const clean = emailOrUsername.trim().toLowerCase();
    const user = this.getUserByEmailOrUsername(clean);
    if (!user) return false;
    return user.status === 'suspended' || user.status === 'pending_deletion';
  },

  canUserAccessQuote(userEmail: string, userRole: string, quoteShipperEmail?: string): { allowed: boolean; reason?: string } {
    if (!userEmail) return { allowed: false, reason: 'Authentication required' };
    if (['admin', 'freight-agent', 'customs-officer'].includes(userRole)) {
      return { allowed: true };
    }
    const cleanUser = userEmail.trim().toLowerCase();
    const cleanShipper = (quoteShipperEmail || '').trim().toLowerCase();

    if (!cleanShipper || cleanUser === cleanShipper || cleanShipper.includes(cleanUser.split('@')[0])) {
      return { allowed: true };
    }
    return { allowed: false, reason: `Access Denied: You do not have permission to view quotes belonging to ${quoteShipperEmail || 'another customer'}.` };
  },
};
