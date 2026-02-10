import { HttpRequest } from './types';
import { handleRequest } from './app';

interface FcHttpEvent {
  rawPath?: string;
  path?: string;
  httpMethod?: string;
  headers?: Record<string, string>;
  queryParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  body?: string;
  isBase64Encoded?: boolean;
  requestContext?: {
    http?: {
      method?: string;
      path?: string;
    };
  };
}

const normalizeHeaders = (headers: Record<string, unknown> | undefined): Record<string, string> => {
  const normalized: Record<string, string> = {};
  if (!headers) {
    return normalized;
  }

  Object.entries(headers).forEach(([key, value]) => {
    if (typeof value === 'string') {
      normalized[key.toLowerCase()] = value;
      return;
    }

    if (Array.isArray(value)) {
      normalized[key.toLowerCase()] = value.join(',');
    }
  });

  return normalized;
};

const normalizeQuery = (query: Record<string, unknown> | undefined): Record<string, string> => {
  const normalized: Record<string, string> = {};
  if (!query) {
    return normalized;
  }

  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === 'string') {
      normalized[key] = value;
      return;
    }

    if (Array.isArray(value)) {
      normalized[key] = value.join(',');
    }
  });

  return normalized;
};

const parseQueryFromPath = (rawPath: string): Record<string, string> => {
  const queryString = rawPath.includes('?') ? rawPath.split('?')[1] : '';
  if (!queryString) {
    return {};
  }

  const params = new URLSearchParams(queryString);
  const query: Record<string, string> = {};

  params.forEach((value, key) => {
    query[key] = value;
  });

  return query;
};

const parseBody = (rawBody: string): unknown => {
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch (_error) {
    return rawBody;
  }
};

const parseEvent = (event: unknown): HttpRequest => {
  const source = typeof event === 'string' ? (JSON.parse(event) as FcHttpEvent) : (event as FcHttpEvent);

  const method = source.httpMethod || source.requestContext?.http?.method || 'GET';
  const rawPath = source.rawPath || source.path || source.requestContext?.http?.path || '/';
  const headers = normalizeHeaders(source.headers);

  const parsedPath = rawPath.split('?')[0] || '/';
  const query = {
    ...parseQueryFromPath(rawPath),
    ...normalizeQuery(source.queryStringParameters),
    ...normalizeQuery(source.queryParameters),
  };

  let rawBody = source.body || '';
  if (source.isBase64Encoded && rawBody) {
    rawBody = Buffer.from(rawBody, 'base64').toString('utf-8');
  }

  return {
    method,
    path: parsedPath,
    headers,
    query,
    rawBody,
    body: parseBody(rawBody),
  };
};

export const handler = async (event: unknown): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded: boolean;
}> => {
  const request = parseEvent(event);
  const response = await handleRequest(request);

  return {
    ...response,
    isBase64Encoded: false,
  };
};
