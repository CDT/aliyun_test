import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload, SafeUser } from '../types';

export const signAccessToken = (user: SafeUser): string => {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: '2h',
    },
  );
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};
