import { config } from './config';
import { requireAuth } from './middleware/auth';
import { requireRole } from './middleware/role';
import { createUser, deleteUser, findUserById, findUserByUsername, isRole, listUsers, updateUser } from './services/userStore';
import { HttpRequest, HttpResponse, Role } from './types';
import { HttpError } from './utils/errors';
import { signAccessToken } from './utils/jwt';
import { fail, ok, toHttpResponse } from './utils/response';

const normalizePath = (value: string): string => {
  const noQuery = value.split('?')[0] || '/';
  const withLeadingSlash = noQuery.startsWith('/') ? noQuery : `/${noQuery}`;
  const noTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return noTrailingSlash || '/';
};

const stripPrefix = (path: string, prefix: string): string | null => {
  const normalizedPrefix = normalizePath(prefix);
  if (normalizedPrefix === '/') {
    return path;
  }

  if (path === normalizedPrefix) {
    return '/';
  }

  if (path.startsWith(`${normalizedPrefix}/`)) {
    return path.slice(normalizedPrefix.length) || '/';
  }

  return null;
};

const resolveRoutePath = (path: string, prefix: string): string | null => {
  const normalizedPrefix = normalizePath(prefix);
  const directMatch = stripPrefix(path, normalizedPrefix);
  if (directMatch) {
    return directMatch;
  }

  const marker = `${normalizedPrefix}/`;
  const markerIndex = path.indexOf(marker);
  if (markerIndex >= 0) {
    return path.slice(markerIndex + normalizedPrefix.length) || '/';
  }

  if (path.endsWith(normalizedPrefix)) {
    return '/';
  }

  return null;
};

const normalizeHeaderKeys = (headers: Record<string, string>): Record<string, string> => {
  const normalized: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    normalized[key.toLowerCase()] = value;
  });
  return normalized;
};

const getCorsHeaders = (headers: Record<string, string>): Record<string, string> => {
  const allowedOrigins = config.allowOrigin
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const requestOrigin = headers.origin || '';

  let allowOrigin = '*';
  if (!allowedOrigins.includes('*') && allowedOrigins.length > 0) {
    allowOrigin = allowedOrigins[0];
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      allowOrigin = requestOrigin;
    }
  }

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    Vary: 'Origin',
  };

  if (allowOrigin !== '*') {
    corsHeaders['Access-Control-Allow-Credentials'] = 'true';
  }

  return corsHeaders;
};

const parseBodyObject = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError('Request body must be a JSON object', 400);
  }

  return body as Record<string, unknown>;
};

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const parseRole = (value: unknown): Role => {
  if (!isRole(value)) {
    throw new HttpError('Role must be admin or user', 400);
  }

  return value;
};

export const handleRequest = async (request: HttpRequest): Promise<HttpResponse> => {
  const method = request.method.toUpperCase();
  const headers = normalizeHeaderKeys(request.headers);
  const corsHeaders = getCorsHeaders(headers);

  try {
    if (method === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: corsHeaders,
        body: '',
      };
    }

    const normalizedPath = normalizePath(request.path || '/');
    const routePath = resolveRoutePath(normalizedPath, config.apiPrefix);

    if (!routePath) {
      return toHttpResponse(404, fail('Route not found'), corsHeaders);
    }

    if (routePath === '/auth/login' && method === 'POST') {
      const body = parseBodyObject(request.body);
      const username = asString(body.username).trim();
      const password = asString(body.password);

      if (!username || !password) {
        throw new HttpError('Username and password are required', 400);
      }

      const user = await findUserByUsername(username);
      if (!user || user.password !== password) {
        throw new HttpError('Invalid username or password', 401);
      }

      const safeUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      const accessToken = signAccessToken(safeUser);

      return toHttpResponse(
        200,
        ok(
          {
            accessToken,
            user: safeUser,
          },
          'Login successful',
        ),
        corsHeaders,
      );
    }

    if (routePath === '/auth/me' && method === 'GET') {
      const tokenPayload = requireAuth(headers);
      const user = await findUserById(tokenPayload.sub);
      if (!user) {
        throw new HttpError('User does not exist', 401);
      }

      return toHttpResponse(
        200,
        ok({
          id: user.id,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }),
        corsHeaders,
      );
    }

    if (routePath === '/users') {
      const tokenPayload = requireAuth(headers);
      requireRole(tokenPayload, ['admin']);

      if (method === 'GET') {
        const data = await listUsers();
        return toHttpResponse(200, ok(data), corsHeaders);
      }

      if (method === 'POST') {
        const body = parseBodyObject(request.body);
        const username = asString(body.username).trim();
        const password = asString(body.password);
        const role = parseRole(body.role);

        const createdUser = await createUser({ username, password, role });
        return toHttpResponse(201, ok(createdUser, 'User created'), corsHeaders);
      }

      return toHttpResponse(405, fail('Method not allowed'), corsHeaders);
    }

    const userRouteMatch = routePath.match(/^\/users\/([^/]+)$/);
    if (userRouteMatch) {
      const tokenPayload = requireAuth(headers);
      requireRole(tokenPayload, ['admin']);

      const userId = userRouteMatch[1];

      if (method === 'PUT' || method === 'PATCH') {
        const body = parseBodyObject(request.body);

        const patch: {
          username?: string;
          password?: string;
          role?: Role;
        } = {};

        if (typeof body.username === 'string') {
          patch.username = body.username;
        }

        if (typeof body.password === 'string') {
          patch.password = body.password;
        }

        if (typeof body.role === 'string') {
          patch.role = parseRole(body.role);
        }

        if (!patch.username && !patch.password && !patch.role) {
          throw new HttpError('At least one field is required for update', 400);
        }

        const updatedUser = await updateUser(userId, patch);
        return toHttpResponse(200, ok(updatedUser, 'User updated'), corsHeaders);
      }

      if (method === 'DELETE') {
        if (tokenPayload.sub === userId) {
          throw new HttpError('Cannot delete current logged-in user', 400);
        }

        const deletedUser = await deleteUser(userId);
        return toHttpResponse(200, ok(deletedUser, 'User deleted'), corsHeaders);
      }

      return toHttpResponse(405, fail('Method not allowed'), corsHeaders);
    }

    return toHttpResponse(404, fail('Route not found'), corsHeaders);
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return toHttpResponse(error.statusCode, fail(error.message, error.code), corsHeaders);
    }

    console.error('[app] unexpected error:', error);
    return toHttpResponse(500, fail('Internal server error'), corsHeaders);
  }
};
