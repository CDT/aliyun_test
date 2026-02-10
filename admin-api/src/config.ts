import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: toNumber(process.env.PORT, 9000),
  apiPrefix: process.env.API_PREFIX || '/api',
  jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
  allowOrigin: process.env.ALLOW_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173',
  ossBucket: process.env.OSS_BUCKET || '',
  ossRegion: process.env.OSS_REGION || 'cn-hangzhou',
  ossEndpoint: process.env.OSS_ENDPOINT || '',
  ossObjectKey: process.env.OSS_OBJECT_KEY || 'admin-demo/users.json',
};
