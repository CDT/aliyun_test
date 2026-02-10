import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import OSS from 'ali-oss';
import { config } from '../config';
import { DemoUser, Role, SafeUser } from '../types';
import { HttpError } from '../utils/errors';

const defaultUsersFilePath = path.resolve(process.cwd(), 'src/data/default-users.json');

let users: DemoUser[] = [];
let initialized = false;

const isRoleValue = (value: unknown): value is Role => value === 'admin' || value === 'user';

export const isRole = isRoleValue;

const sanitizeUser = (user: DemoUser): SafeUser => ({
  id: user.id,
  username: user.username,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const loadUsersFromLocalJson = async (): Promise<DemoUser[]> => {
  const fileText = await fs.readFile(defaultUsersFilePath, 'utf-8');
  const parsed = JSON.parse(fileText) as DemoUser[];

  if (!Array.isArray(parsed)) {
    throw new Error('default-users.json must be an array');
  }

  return parsed;
};

const createOSSClient = (): OSS | null => {
  if (!config.ossBucket || !config.ossRegion) {
    return null;
  }

  const accessKeyId = process.env.ALICLOUD_ACCESS_KEY_ID || process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  const accessKeySecret =
    process.env.ALICLOUD_ACCESS_KEY_SECRET || process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;

  if (!accessKeyId || !accessKeySecret) {
    return null;
  }

  return new OSS({
    region: config.ossRegion,
    bucket: config.ossBucket,
    endpoint: config.ossEndpoint || undefined,
    accessKeyId,
    accessKeySecret,
  });
};

const loadUsersFromOSS = async (): Promise<DemoUser[] | null> => {
  const client = createOSSClient();
  if (!client) {
    return null;
  }

  try {
    const result = await client.get(config.ossObjectKey);
    const content = result.content ? result.content.toString('utf-8') : '';
    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content) as DemoUser[];
    if (!Array.isArray(parsed)) {
      throw new Error('OSS users JSON must be an array');
    }

    return parsed;
  } catch (error: any) {
    const code = error?.code || error?.name;
    if (code === 'NoSuchKey' || code === 'NotFound') {
      return null;
    }

    console.warn('[userStore] failed to load users from OSS:', error?.message || error);
    return null;
  }
};

const persistUsersToOSS = async (): Promise<void> => {
  const client = createOSSClient();
  if (!client) {
    return;
  }

  try {
    const payload = JSON.stringify(users, null, 2);
    await client.put(config.ossObjectKey, Buffer.from(payload, 'utf-8'));
  } catch (error: any) {
    console.warn('[userStore] failed to persist users to OSS:', error?.message || error);
  }
};

const ensureInitialized = async (): Promise<void> => {
  if (initialized) {
    return;
  }

  const ossUsers = await loadUsersFromOSS();
  if (ossUsers && ossUsers.length > 0) {
    users = clone(ossUsers);
    initialized = true;
    return;
  }

  users = await loadUsersFromLocalJson();
  initialized = true;
};

const ensureUniqueUsername = (username: string, ignoreUserId?: string): void => {
  const normalized = username.trim().toLowerCase();
  const exists = users.some((item) => item.username.toLowerCase() === normalized && item.id !== ignoreUserId);
  if (exists) {
    throw new HttpError('Username already exists', 409);
  }
};

const nowISO = (): string => new Date().toISOString();

export const findUserByUsername = async (username: string): Promise<DemoUser | undefined> => {
  await ensureInitialized();
  return users.find((item) => item.username === username);
};

export const findUserById = async (userId: string): Promise<DemoUser | undefined> => {
  await ensureInitialized();
  return users.find((item) => item.id === userId);
};

export const listUsers = async (): Promise<SafeUser[]> => {
  await ensureInitialized();
  return users.map(sanitizeUser);
};

export const createUser = async (input: {
  username: string;
  password: string;
  role: Role;
}): Promise<SafeUser> => {
  await ensureInitialized();

  const username = input.username.trim();
  if (!username) {
    throw new HttpError('Username is required', 400);
  }

  if (!input.password || input.password.length < 6) {
    throw new HttpError('Password must be at least 6 characters', 400);
  }

  if (!isRoleValue(input.role)) {
    throw new HttpError('Role must be admin or user', 400);
  }

  ensureUniqueUsername(username);

  const timestamp = nowISO();
  const newUser: DemoUser = {
    id: crypto.randomUUID(),
    username,
    password: input.password,
    role: input.role,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  users.push(newUser);
  await persistUsersToOSS();

  return sanitizeUser(newUser);
};

export const updateUser = async (
  userId: string,
  patch: {
    username?: string;
    password?: string;
    role?: Role;
  },
): Promise<SafeUser> => {
  await ensureInitialized();

  const target = users.find((item) => item.id === userId);
  if (!target) {
    throw new HttpError('User not found', 404);
  }

  if (typeof patch.username === 'string') {
    const username = patch.username.trim();
    if (!username) {
      throw new HttpError('Username is required', 400);
    }

    ensureUniqueUsername(username, target.id);
    target.username = username;
  }

  if (typeof patch.password === 'string') {
    if (patch.password.length < 6) {
      throw new HttpError('Password must be at least 6 characters', 400);
    }

    target.password = patch.password;
  }

  if (typeof patch.role === 'string') {
    if (!isRoleValue(patch.role)) {
      throw new HttpError('Role must be admin or user', 400);
    }

    target.role = patch.role;
  }

  target.updatedAt = nowISO();
  await persistUsersToOSS();

  return sanitizeUser(target);
};

export const deleteUser = async (userId: string): Promise<SafeUser> => {
  await ensureInitialized();

  const index = users.findIndex((item) => item.id === userId);
  if (index < 0) {
    throw new HttpError('User not found', 404);
  }

  const target = users[index];
  if (target.role === 'admin') {
    const adminCount = users.filter((item) => item.role === 'admin').length;
    if (adminCount <= 1) {
      throw new HttpError('Cannot delete the last admin user', 400);
    }
  }

  users.splice(index, 1);
  await persistUsersToOSS();

  return sanitizeUser(target);
};
