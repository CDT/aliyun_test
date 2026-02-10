import { JwtPayload } from '../types';
import { HttpError } from '../utils/errors';
import { verifyAccessToken } from '../utils/jwt';

export const requireAuth = (headers: Record<string, string>): JwtPayload => {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader) {
    throw new HttpError('Missing Authorization header', 401);
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError('Invalid Authorization header format', 401);
  }

  try {
    return verifyAccessToken(token);
  } catch (error) {
    throw new HttpError('Invalid or expired token', 401);
  }
};
