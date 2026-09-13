// Authentication Service — real credential storage & session tokens backed by MongoDB
// Passwords hashed with Node crypto scrypt (salted). Sessions stored in DB with TTL.
import crypto from 'crypto';
import { UserRole } from '../../types';
import {
  getDb,
  usersCollection,
  sessionsCollection,
  companiesCollection,
} from '../db/database';

export type PlatformRole = 'CUSTOMER' | 'FREIGHT_AGENT' | 'CUSTOMS_OFFICER' | 'ADMIN' | 'BUSINESS' | 'BROKER';

export interface DbUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending_deletion';
  companyName?: string;
  companyId?: string;
  phone?: string;
  generatedBy?: string;
  notes?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  companyName?: string;
  companyId?: string;
}

export interface AuthResult {
  success: boolean;
  user?: SessionUser & { token?: string };
  token?: string;
  error?: string;
}

const SESSION_TTL_HOURS = 24;

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, useSalt, 64).toString('hex');
  return { hash, salt: useSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function normalizeRole(role: UserRole | string): UserRole {
  const r = (role || 'user').toLowerCase();
  if (r === 'shipper') return 'user';
  if (r === 'customer') return 'user';
  if (r === 'customer-officer') return 'customs-officer';
  return r as UserRole;
}

/** Internal roles allowed to review quotes & view all shipments */
export function isInternalRole(role: UserRole | string): boolean {
  const r = normalizeRole(role as UserRole);
  return ['freight-agent', 'admin', 'business', 'broker', 'customs-officer', 'customer-officer'].includes(r);
}

export function roleLabel(role: UserRole | string): PlatformRole {
  const r = normalizeRole(role as UserRole);
  switch (r) {
    case 'admin': return 'ADMIN';
    case 'freight-agent': return 'FREIGHT_AGENT';
    case 'customs-officer': case 'customer-officer': return 'CUSTOMS_OFFICER';
    case 'business': return 'BUSINESS';
    case 'broker': return 'BROKER';
    default: return 'CUSTOMER';
  }
}

async function generateUserId(): Promise<string> {
  const db = await getDb();
  const counters = db.collection('counters');
  const result = await counters.findOneAndUpdate(
    { _id: 'user_id' as any },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  const seq = result ? (result as any).seq ?? 7 : 7;
  return `USR-${String(seq).padStart(3, '0')}`;
}
// ---------------------------------------------------------------------------
// Internal types & helpers
// ---------------------------------------------------------------------------

type UserDoc = DbUser;

interface SessionDoc {
  token: string;
  userId: string;
  email: string;
  role: UserRole;
  createdAt: string;
  expiresAt: Date | string;
}

/** Public profile shape — never exposes password hash/salt */
export type PublicUser = Omit<DbUser, 'passwordHash' | 'passwordSalt'>;

const SESSION_TTL_MS = SESSION_TTL_HOURS * 60 * 60 * 1000;

export function toSessionUser(doc: UserDoc): SessionUser {
  return {
    id: doc.id,
    email: doc.email,
    username: doc.username,
    fullName: doc.fullName,
    role: normalizeRole(doc.role),
    companyName: doc.companyName,
    companyId: doc.companyId,
  };
}


export function toPublicUser(doc: UserDoc): PublicUser {
  const { passwordHash, passwordSalt, ...rest } = doc;
  return { ...rest, role: normalizeRole(rest.role) };
}

function isSuperadmin(doc: { email?: string; username?: string }): boolean {
  return (
    (doc.email || '').trim().toLowerCase() === 'admin@freighthub.com' ||
    (doc.username || '').trim().toLowerCase() === 'admin@freighthub.com' ||
    (doc.username || '').trim().toLowerCase() === 'admin.root'
  );
}

function isValidEmail(email: string): boolean {
  return !!email && email.includes('@') && email.includes('.');
}

function isValidUsername(username: string): boolean {
  return !!username && username.length >= 3 && /^[a-z0-9._-]+$/i.test(username);
}

/** Role alias compatibility — mirrors the sign-in mapping used by the frontend portals */
export function rolesCompatible(queryRole: string | undefined, userRole: UserRole): boolean {
  if (!queryRole) return true;
  const r = normalizeRole(queryRole as UserRole);
  const u = normalizeRole(userRole);
  if (r === u) return true;
  if (r === 'shipper') return u === 'user';
  if (r === 'user') return u === 'shipper' || u === 'customer';
  if (r === 'customer') return u === 'user' || u === 'customer';
  if (r === 'business') return u === 'broker';
  if (r === 'freight-agent') return u === 'broker';
  if (r === 'broker') return u === 'business' || u === 'freight-agent';
  if (r === 'customer-officer') return u === 'customs-officer';
  if (r === 'customs-officer') return u === 'customer-officer';
  return false;
}

function nowStamp(): string {
  const now = new Date();
  return `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function dbErrorMessage(err: unknown): string {
  const e = err as { name?: string; message?: string; code?: number | string };
  if (e?.name === 'MongoServerSelectionError' || e?.code === 'ECONNREFUSED') {
    return 'Database is unreachable. Please ensure MongoDB is running and try again.';
  }
  return e?.message || 'Unexpected database error.';
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

export async function createSession(user: SessionUser): Promise<string> {
  const sessions = await sessionsCollection();
  const token = crypto.randomBytes(32).toString('hex');
  const createdAt = new Date();
  await sessions.insertOne({
    token,
    userId: user.id,
    email: user.email.trim().toLowerCase(),
    role: user.role,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + SESSION_TTL_MS),
  });
  return token;
}

/** Resolve a session token (Bearer / x-auth-token) into the signed-in user */
export async function getSessionUser(token: string): Promise<SessionUser | null> {
  if (!token) return null;
  const sessions = await sessionsCollection();
  const session = (await sessions.findOne({ token })) as unknown as SessionDoc | null;
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await sessions.deleteOne({ token });
    return null;
  }
  const users = await usersCollection();
  const user = (await users.findOne({ id: session.userId })) as unknown as UserDoc | null;
  if (!user || user.status !== 'active') return null;
  return toSessionUser(user);
}

export async function destroySession(token?: string): Promise<void> {
  if (!token) return;
  const sessions = await sessionsCollection();
  await sessions.deleteOne({ token });
}

export async function destroySessionsForUser(userId: string): Promise<void> {
  const sessions = await sessionsCollection();
  await sessions.deleteMany({ userId });
}
// ---------------------------------------------------------------------------
// Registration & Authentication
// ---------------------------------------------------------------------------

export interface RegisterInput {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole | string;
  status?: 'active' | 'suspended' | 'pending_deletion';
  companyName?: string;
  companyId?: string;
  phone?: string;
  notes?: string;
  generatedBy?: string;
}

async function buildNewUserDoc(input: RegisterInput): Promise<{ doc: UserDoc } | { error: string }> {
  const fullName = (input.fullName || '').trim();
  const username = (input.username || '').trim().toLowerCase();
  const email = (input.email || '').trim().toLowerCase();
  const password = (input.password || '').trim();
  const role = normalizeRole((input.role || 'user') as UserRole);

  if (!fullName) return { error: 'Full name is required.' };
  if (!isValidEmail(email)) {
    return { error: 'Please provide a valid email address (e.g. name@domain.com).' };
  }
  if (!isValidUsername(username)) {
    return { error: 'Username must be at least 3 characters and contain only letters, numbers, dots, or hyphens.' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  const users = await usersCollection();
  const existingEmail = (await users.findOne({ email })) as unknown as UserDoc | null;
  if (existingEmail) {
    return { error: `An account with email "${email}" is already registered.` };
  }
  const existingUsername = (await users.findOne({ username })) as unknown as UserDoc | null;
  if (existingUsername) {
    return { error: `The username "${username}" is already taken. Please choose another.` };
  }

  const { hash, salt } = hashPassword(password);
  const doc: UserDoc = {
    id: await generateUserId(),
    fullName,
    username,
    email,
    passwordHash: hash,
    passwordSalt: salt,
    role,
    status: input.status || 'active',
    companyName: input.companyName?.trim() || undefined,
    companyId: input.companyId?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    generatedBy: input.generatedBy?.trim() || 'Self-Registered',
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString().split('T')[0],
  };
  return { doc };
}

/** Self-service registration — only plain 'user' (shipper) accounts, mirroring portal rules */
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  try {
    await ensureAuthSeed();
    if (normalizeRole((input.role || 'user') as UserRole) !== 'user') {
      return {
        success: false,
        error: 'Self-registration is only allowed for User accounts. All administrative, business, agent, and officer accounts must be created and verified via the Admin Portal.',
      };
    }
    const built = await buildNewUserDoc({ ...input, role: 'user', generatedBy: input.generatedBy || 'Self-Registered' });
    if ('error' in built) return { success: false, error: built.error };

    const users = await usersCollection();
    await users.insertOne(built.doc);

    const sessionUser = toSessionUser(built.doc);
    const token = await createSession(sessionUser);
    return { success: true, user: { ...sessionUser, token }, token };
  } catch (err: any) {
    if (err?.code === 11000) {
      return { success: false, error: 'An account with this email or username already exists.' };
    }
    return { success: false, error: dbErrorMessage(err) };
  }
}
/**
 * Authenticate with email OR username + password (and an optional role portal filter).
 * Mirrors the frontend `userService.authenticate` behaviour, including admin aliases
 * ("admin", "admin.root") and role alias matching (shipper/user, business/broker, ...).
 */
export async function authenticateUser(
  emailOrUsername: string,
  password: string,
  role?: string
): Promise<AuthResult> {
  try {
    await ensureAuthSeed();
    const term = (emailOrUsername || '').trim().toLowerCase();
    const users = await usersCollection();

    let candidates: UserDoc[] = [];
    if (term) {
      const found = (await users
        .find({ $or: [{ email: term }, { username: term }] })
        .toArray()) as unknown as UserDoc[];
      candidates = [...found];

      // Admin portal shortcut aliases: "admin" / "admin.root"
      if (candidates.length === 0 || ['admin', 'admin.root'].includes(term)) {
        const superadmin = (await users.findOne({ email: 'admin@freighthub.com' })) as unknown as UserDoc | null;
        if (superadmin && !candidates.some((c) => c.id === superadmin.id)) {
          candidates.push(superadmin);
        }
      }
    }

    const matchedUser = candidates.find((u) => rolesCompatible(role, u.role));

    if (!matchedUser) {
      const displayRoleLabel =
        role === 'customs-officer'
          ? 'CUSTOMS OFFICER'
          : (role || 'customer').toUpperCase();
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
    if (matchedUser.status === 'pending_deletion') {
      return {
        success: false,
        error: 'This account is scheduled for deactivation. Please contact the System Administrator.',
      };
    }

    if (!matchedUser.passwordHash || !matchedUser.passwordSalt) {
      return { success: false, error: 'Account credentials are not initialized. Please contact the System Administrator.' };
    }
    if (!password || !verifyPassword(password.trim(), matchedUser.passwordHash, matchedUser.passwordSalt)) {
      return { success: false, error: 'Incorrect password. Please verify your password and try again.' };
    }

    const lastLoginAt = nowStamp();
    await users.updateOne({ id: matchedUser.id }, { $set: { lastLoginAt } });

    const sessionUser = toSessionUser(matchedUser);
    const token = await createSession(sessionUser);
    return { success: true, user: { ...sessionUser, token }, token };
  } catch (err) {
    return { success: false, error: dbErrorMessage(err) };
  }
}
export interface UpdateUserInput {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole | string;
  status?: 'active' | 'suspended' | 'pending_deletion';
  companyName?: string;
  companyId?: string;
  phone?: string;
  notes?: string;
}

export async function listUsers(): Promise<PublicUser[]> {
  const users = await usersCollection();
  const docs = (await users.find({}).toArray()) as unknown as UserDoc[];
  return docs.map(toPublicUser);
}

/** Admin provisions any account — internal roles are NOT reachable via self-registration */
export async function adminCreateUser(
  input: RegisterInput,
  adminIdentifier: string
): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
  try {
    await ensureAuthSeed();
    const built = await buildNewUserDoc({
      ...input,
      generatedBy: input.generatedBy?.trim() || `Admin Generated (${adminIdentifier})`,
    });
    if ('error' in built) return { success: false, error: built.error };
    const users = await usersCollection();
    await users.insertOne(built.doc);
    return { success: true, user: toPublicUser(built.doc) };
  } catch (err: any) {
    if (err?.code === 11000) {
      return { success: false, error: 'An account with this email or username already exists.' };
    }
    return { success: false, error: dbErrorMessage(err) };
  }
}

export async function updateUser(
  id: string,
  updates: UpdateUserInput
): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
  try {
    const users = await usersCollection();
    const target = (await users.findOne({ id })) as unknown as ManageableUserDoc | null;
    if (!target) return { success: false, error: 'User not found.' };
    const isRoot = isSuperadmin(target);

    const patch: Record<string, unknown> = {};

    if (updates.email !== undefined) {
      const clean = updates.email.trim().toLowerCase();
      if (!isValidEmail(clean)) return { success: false, error: 'Please provide a valid email address.' };
      const dup = (await users.findOne({ email: clean })) as unknown as UserDoc | null;
      if (dup && dup.id !== id) {
        return { success: false, error: `Email "${clean}" is already in use by another account.` };
      }
      patch.email = clean;
    }
    if (updates.username !== undefined) {
      const clean = updates.username.trim().toLowerCase();
      if (!isValidUsername(clean)) {
        return { success: false, error: 'Username must be at least 3 characters and contain only letters, numbers, dots, or hyphens.' };
      }
      const dup = (await users.findOne({ username: clean })) as unknown as UserDoc | null;
      if (dup && dup.id !== id) {
        return { success: false, error: `Username "${clean}" is already in use by another account.` };
      }
      patch.username = clean;
    }
    if (updates.fullName !== undefined) patch.fullName = updates.fullName.trim();
    if (updates.companyName !== undefined) patch.companyName = updates.companyName.trim() || undefined;
    if (updates.companyId !== undefined) patch.companyId = updates.companyId.trim() || undefined;
    if (updates.phone !== undefined) patch.phone = updates.phone.trim() || undefined;
    if (updates.notes !== undefined) patch.notes = updates.notes.trim() || undefined;

    if (updates.role !== undefined) {
      const newRole = normalizeRole(updates.role as UserRole);
      if (isRoot && newRole !== 'admin') {
        return { success: false, error: 'The System Administrator Root account role cannot be changed.' };
      }
      patch.role = newRole;
    }
    if (updates.status !== undefined) {
      if (isRoot && updates.status !== 'active') {
        return { success: false, error: 'The System Administrator Root account cannot be suspended or deactivated.' };
      }
      patch.status = updates.status;
    }
    if (updates.password !== undefined) {
      const pw = updates.password.trim();
      if (pw.length < 6) return { success: false, error: 'Password must be at least 6 characters long.' };
      const { hash, salt } = hashPassword(pw);
      patch.passwordHash = hash;
      patch.passwordSalt = salt;
    }

    if (Object.keys(patch).length === 0) {
      return { success: true, user: toPublicUser(target) };
    }

    await users.updateOne({ id }, { $set: patch });
    // Deactivating an account invalidates its active sessions immediately
    if (updates.status && updates.status !== 'active') {
      await destroySessionsForUser(id);
    }
    const updated = (await users.findOne({ id })) as unknown as ManageableUserDoc;
    return { success: true, user: toPublicUser(updated) };
  } catch (err) {
    return { success: false, error: dbErrorMessage(err) };
  }
}
// ---------------------------------------------------------------------------
// User administration (Admin Portal parity)
// ---------------------------------------------------------------------------

type DeletionFields = {
  deletionReason?: string;
  deletionScheduledAt?: string;
  deactivationDeadline?: string;
  deletionInitiatedBy?: string;
};
type ManageableUserDoc = DbUser & DeletionFields;

/** Schedule an account for deactivation within 24 hours with a mandatory reason */
export async function scheduleUserDeletion(
  id: string,
  reason: string,
  adminIdentifier?: string
): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
  try {
    const trimmedReason = (reason || '').trim();
    if (!trimmedReason) {
      return { success: false, error: 'A mandatory reason for account deletion must be provided.' };
    }
    const users = await usersCollection();
    const target = (await users.findOne({ id })) as unknown as ManageableUserDoc | null;
    if (!target) return { success: false, error: 'User account not found.' };
    if (isSuperadmin(target)) {
      return { success: false, error: 'System Administrator Root account (admin@freighthub.com) cannot be deleted.' };
    }

    const now = new Date();
    const patch: DeletionFields & { status: ManageableUserDoc['status'] } = {
      status: 'pending_deletion',
      deletionReason: trimmedReason,
      deletionScheduledAt: now.toISOString(),
      deactivationDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      deletionInitiatedBy: adminIdentifier || 'System Administrator',
    };
    await users.updateOne({ id }, { $set: patch });
    await destroySessionsForUser(id);

    const updated = (await users.findOne({ id })) as unknown as ManageableUserDoc;
    return { success: true, user: toPublicUser(updated) };
  } catch (err) {
    return { success: false, error: dbErrorMessage(err) };
  }
}

/** Cancel a scheduled deletion & restore the account to active */
export async function cancelUserDeletion(
  id: string
): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
  try {
    const users = await usersCollection();
    const target = (await users.findOne({ id })) as unknown as ManageableUserDoc | null;
    if (!target) return { success: false, error: 'User account not found.' };

    await users.updateOne(
      { id },
      {
        $set: { status: 'active' },
        $unset: {
          deletionReason: '',
          deletionScheduledAt: '',
          deactivationDeadline: '',
          deletionInitiatedBy: '',
        },
      }
    );
    const updated = (await users.findOne({ id })) as unknown as ManageableUserDoc;
    return { success: true, user: toPublicUser(updated) };
  } catch (err) {
    return { success: false, error: dbErrorMessage(err) };
  }
}

/** Permanent immediate purge — the superadmin root account is protected */
export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const users = await usersCollection();
    const target = (await users.findOne({ id })) as unknown as UserDoc | null;
    if (!target) return { success: false, error: 'User not found.' };
    if (isSuperadmin(target)) {
      return { success: false, error: 'System Administrator Root account (admin@freighthub.com) cannot be deleted.' };
    }
    await users.deleteOne({ id });
    await destroySessionsForUser(id);
    return { success: true };
  } catch (err) {
    return { success: false, error: dbErrorMessage(err) };
  }
}
// ---------------------------------------------------------------------------
// Default platform accounts (parity with the portal demo credentials)
// ---------------------------------------------------------------------------

interface SeedUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: 'active';
  createdAt: string;
  lastLoginAt?: string;
  companyName?: string;
  companyId?: string;
  generatedBy?: string;
  phone?: string;
  notes?: string;
}

const SEED_COMPANIES = [
  { companyId: 'COMP-001', name: 'Global Freight Networks', code: 'GFN', isActive: true, createdAt: '2026-01-10T00:00:00Z' },
  { companyId: 'COMP-002', name: 'Oceanic Express Logistics', code: 'OEL', isActive: true, createdAt: '2026-02-15T00:00:00Z' },
  { companyId: 'COMP-003', name: 'TransContinental Shipping', code: 'TCS', isActive: true, createdAt: '2026-03-20T00:00:00Z' },
];

const SEED_USERS: SeedUser[] = [
  { id: 'USR-001', fullName: 'Aparajita De', username: 'aparajita', email: 'aparajita@freighthub.in', password: 'user123', role: 'user', status: 'active', createdAt: '2026-08-01', lastLoginAt: '2026-08-17 08:30', companyName: 'ABC Logistics Corp', generatedBy: 'Self-Registered', phone: '+91 98765 43210', notes: 'Primary freight user enterprise account' },
  { id: 'USR-002', fullName: 'Rohit Sharma (Commercial Lead)', username: 'rohit.business', email: 'business@freighthub.in', password: 'business123', role: 'business', status: 'active', createdAt: '2026-07-15', lastLoginAt: '2026-08-16 18:45', companyName: 'Apex Commercial Pricing Ltd', generatedBy: 'Admin Generated (admin@freighthub.com)', phone: '+91 98111 22334', notes: 'Commercial pricing desk, margin governance & user quote approvals' },
  { id: 'USR-003', fullName: 'Priya Nair (Freight Agent Lead)', username: 'priya.agent', email: 'agent@freighthub.in', password: 'agent123', role: 'freight-agent', status: 'active', createdAt: '2026-07-20', lastLoginAt: '2026-08-15 14:10', companyName: 'Global Freight Networks', companyId: 'COMP-001', generatedBy: 'Admin Generated (admin@freighthub.com)', phone: '+91 98222 33445', notes: 'Vessel tracking, carrier spot bidding, route optimizer and port dispatch' },
  { id: 'USR-004', fullName: 'Michael Chang', username: 'mchang.global', email: 'm.chang@pacificlogistics.com', password: 'user456', role: 'user', status: 'active', createdAt: '2026-08-10', lastLoginAt: '2026-08-14 11:20', companyName: 'Pacific Maritime Corp', generatedBy: 'Self-Registered', phone: '+65 6789 0123', notes: 'LCL & FCL regular user customer' },
  { id: 'USR-005', fullName: 'System Administrator Root', username: 'admin@freighthub.com', email: 'admin@freighthub.com', password: 'admin1234', role: 'admin', status: 'active', createdAt: '2026-06-01', lastLoginAt: '2026-08-17 08:00', companyName: 'FreightHub Global Core', generatedBy: 'System SuperAdmin', phone: '+1 (800) 555-0199', notes: 'Superuser with full master data, tariff, and user management authority across all portals' },
  { id: 'USR-006', fullName: 'Rajesh Varma (Customer Officer)', username: 'rajesh.officer', email: 'customer.officer@freighthub.in', password: 'officer123', role: 'customer-officer', status: 'active', createdAt: '2026-08-01', lastLoginAt: '2026-08-25 09:15', companyName: 'FreightHub Compliance & Customer Operations Desk', generatedBy: 'System SuperAdmin', phone: '+91 98450 11223', notes: 'Authorized customer officer for compliance validation, document audit, and quote sign-off' },
];

let seedCompleted = false;

/** Idempotently ensure the default platform accounts exist in MongoDB (safe to call often) */
export async function ensureAuthSeed(): Promise<void> {
  if (seedCompleted) return;
  try {
    const companies = await companiesCollection();
    for (const comp of SEED_COMPANIES) {
      const existing = await companies.findOne({ companyId: comp.companyId });
      if (!existing) {
        await companies.insertOne(comp);
      }
    }

    const users = await usersCollection();
    for (const seed of SEED_USERS) {
      const existing = (await users.findOne({
        $or: [{ email: seed.email.toLowerCase() }, { id: seed.id }],
      })) as unknown as UserDoc | null;
      if (existing) continue;
      const { hash, salt } = hashPassword(seed.password);
      await users.insertOne({
        id: seed.id,
        fullName: seed.fullName,
        username: seed.username.toLowerCase(),
        email: seed.email.toLowerCase(),
        passwordHash: hash,
        passwordSalt: salt,
        role: normalizeRole(seed.role),
        status: seed.status,
        companyName: seed.companyName,
        companyId: seed.companyId,
        phone: seed.phone,
        generatedBy: seed.generatedBy,
        notes: seed.notes,
        createdAt: seed.createdAt,
        lastLoginAt: seed.lastLoginAt,
      });
    }
    seedCompleted = true;

    // Keep the user-id counter ahead of every existing USR-### id to avoid collisions
    const db = await getDb();
    const counters = db.collection('counters');
    const allIds = (await users.find({}, { projection: { id: 1 } }).toArray()) as unknown as { id?: string }[];
    let maxSeq = 6;
    for (const u of allIds) {
      const m = /^USR-(\d+)$/.exec(u.id || '');
      if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
    }
    const counterDoc = (await counters.findOne({ _id: 'user_id' as any })) as unknown as { seq?: number } | null;
    if (!counterDoc || (counterDoc.seq ?? 0) < maxSeq) {
      await counters.updateOne({ _id: 'user_id' as any }, { $set: { seq: maxSeq } }, { upsert: true });
    }

    console.log('[+] Auth seed verified: default platform accounts available');
  } catch (err: any) {
    console.warn('[!] Auth seed skipped (database unreachable?):', err?.message);
  }
}
