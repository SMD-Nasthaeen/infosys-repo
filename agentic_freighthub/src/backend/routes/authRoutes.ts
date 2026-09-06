// Auth REST endpoints — registration, login, logout, session profile & user administration
import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin, requireInternal } from '../middleware/auth';
import {
  registerUser,
  authenticateUser,
  destroySession,
  listUsers,
  adminCreateUser,
  updateUser,
  scheduleUserDeletion,
  cancelUserDeletion,
  deleteUser,
  RegisterInput,
  UpdateUserInput,
} from '../auth/authService';

const router = Router();

function isDbOutage(err: unknown): boolean {
  const e = err as { name?: string; code?: string };
  return (
    e?.name === 'MongoServerSelectionError' ||
    e?.name === 'MongoTopologyClosedError' ||
    e?.code === 'ECONNREFUSED'
  );
}

function fail(res: Response, err: unknown): void {
  if (isDbOutage(err)) {
    res.status(503).json({
      success: false,
      error: 'Database is unreachable. Please ensure MongoDB is running and try again.',
    });
    return;
  }
  const message = (err as { message?: string })?.message || 'Unexpected server error.';
  res.status(500).json({ success: false, error: message });
}

/** POST /api/auth/register — self-service customer (shipper/user) registration */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const result = await registerUser(req.body as RegisterInput);
    res.status(result.success ? 201 : 400).json(result);
  } catch (err) {
    fail(res, err);
  }
});

/** POST /api/auth/login — email OR username + password (+ optional portal role) */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, username, emailOrUsername, password, role } = req.body || {};
    const identifier = emailOrUsername || email || username;
    if (!identifier || !password) {
      res.status(400).json({ success: false, error: 'Email/username and password are required.' });
      return;
    }
    const result = await authenticateUser(String(identifier), String(password), role ? String(role) : undefined);
    res.status(result.success ? 200 : 401).json(result);
  } catch (err) {
    fail(res, err);
  }
});

/** POST /api/auth/logout — invalidates the current session token */
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    await destroySession(req.authToken);
    res.json({ success: true, message: 'Signed out successfully.' });
  } catch (err) {
    fail(res, err);
  }
});

/** GET /api/auth/me — current session profile */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ success: true, user: req.authUser });
});

/** GET /api/auth/users — user directory (internal operations roles) */
router.get('/users', requireInternal, async (_req: Request, res: Response) => {
  try {
    const users = await listUsers();
    res.json({ success: true, users, total: users.length });
  } catch (err) {
    fail(res, err);
  }
});

/** POST /api/auth/users — Admin provisions any account (agent, business, officer, admin...) */
router.post('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = req.authUser!;
    const result = await adminCreateUser(req.body as RegisterInput, admin.email);
    res.status(result.success ? 201 : 400).json(result);
  } catch (err) {
    fail(res, err);
  }
});

/** PATCH /api/auth/users/:id — Admin updates profile / role / status / password */
router.patch('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await updateUser(req.params.id, req.body as UpdateUserInput);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    fail(res, err);
  }
});

/** POST /api/auth/users/:id/schedule-deletion — 24h deactivation with mandatory reason */
router.post('/users/:id/schedule-deletion', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = req.authUser!;
    const result = await scheduleUserDeletion(
      req.params.id,
      String(req.body?.reason || ''),
      `${admin.fullName} (${admin.email})`
    );
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    fail(res, err);
  }
});

/** POST /api/auth/users/:id/cancel-deletion — restore a scheduled account to active */
router.post('/users/:id/cancel-deletion', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await cancelUserDeletion(req.params.id);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    fail(res, err);
  }
});

/** DELETE /api/auth/users/:id — permanent purge (superadmin account protected) */
router.delete('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await deleteUser(req.params.id);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    fail(res, err);
  }
});

export default router;