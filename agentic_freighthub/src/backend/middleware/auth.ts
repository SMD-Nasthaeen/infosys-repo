// Auth middleware — resolves Bearer token sessions & guards role-restricted endpoints
import { Request, Response, NextFunction } from 'express';
import { getSessionUser, SessionUser, isInternalRole } from '../auth/authService';

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: SessionUser | null;
    authToken?: string;
  }
}

export async function attachAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : (req.headers['x-auth-token'] as string) || '';
  req.authToken = token || undefined;
  try {
    req.authUser = token ? await getSessionUser(token) : null;
  } catch {
    req.authUser = null;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required. Please sign in.' },
    });
    return;
  }
  next();
}

export function requireInternal(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required. Please sign in.' },
    });
    return;
  }
  if (!isInternalRole(req.authUser.role)) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'This action requires an internal operations role.' },
    });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required. Please sign in.' },
    });
    return;
  }
  if (req.authUser.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'This action is restricted to System Administrators.' },
    });
    return;
  }
  next();
}
