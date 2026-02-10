import { JwtPayload, Role } from '../types';
import { HttpError } from '../utils/errors';

export const requireRole = (user: JwtPayload, allowed: Role[]): void => {
  if (!allowed.includes(user.role)) {
    throw new HttpError('Insufficient permissions', 403);
  }
};
