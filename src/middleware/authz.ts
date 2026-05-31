import type { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { getConfig } from '../config';

export type UserRole = 'reviewer' | 'admin';

interface UserClaims extends JwtPayload {
  sub: string;
  role: UserRole;
}

function verifyJwt(authorization?: string): UserClaims | null {
  if (!authorization) {
    return null;
  }

  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : authorization.trim();
  if (!token) {
    return null;
  }

  const secret = getConfig().CELEB_JWT_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (!decoded || typeof decoded !== 'object') {
      return null;
    }

    const role = decoded.role;
    if (role !== 'reviewer' && role !== 'admin') {
      return null;
    }

    const sub = decoded.sub;
    if (typeof sub !== 'string' || sub.length === 0) {
      return null;
    }

    return decoded as UserClaims;
  } catch {
    return null;
  }
}

export function requireRoles(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const claims = verifyJwt(req.headers.authorization);
    if (!claims || !allowed.includes(claims.role)) {
      res.status(403).json({ error: { code: 'forbidden' } });
      return;
    }

    req.user = claims;
    next();
  };
}
