import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticatedRequest, AppError } from '../types';

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * JWT authentication middleware.
 * Extracts the token from the Authorization header or auth_token cookie,
 * verifies it, and attaches userId to the request.
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.auth_token;

  if (!token) {
    next(new AppError(401, 'Authentication required. Provide a Bearer token.'));
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Token expired. Please log in again.'));
    } else {
      next(new AppError(401, 'Invalid token.'));
    }
  }
}
