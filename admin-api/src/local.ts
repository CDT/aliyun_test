import http from 'node:http';
import { URL } from 'node:url';
import { handleRequest } from './app';
import { config } from './config';
import { HttpRequest } from './types';

const normalizeHeaders = (headers: http.IncomingHttpHeaders): Record<string, string> => {
  const normalized: Record<string, string> = {};

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

const readRawBody = (req: http.IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk: Buffer) => {
      body += chunk.toString('utf-8');
    });

    req.on('end', () => resolve(body));
    req.on('error', (error) => reject(error));
  });
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

const server = http.createServer(async (req, res) => {
  try {
    const method = req.method || 'GET';
    const host = req.headers.host || `localhost:${config.port}`;
    const requestUrl = new URL(req.url || '/', `http://${host}`);
    const rawBody = await readRawBody(req);

    const query: Record<string, string> = {};
    requestUrl.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const request: HttpRequest = {
      method,
      path: requestUrl.pathname,
      headers: normalizeHeaders(req.headers),
      query,
      rawBody,
      body: parseBody(rawBody),
    };

    const response = await handleRequest(request);

    res.writeHead(response.statusCode, response.headers);
    res.end(response.body);
  } catch (error) {
    console.error('[local] failed to process request:', error);
    res.writeHead(500, {
      'Content-Type': 'application/json; charset=utf-8',
    });
    res.end(
      JSON.stringify({
        code: 1,
        data: null,
        message: 'Internal server error',
      }),
    );
  }
});

server.listen(config.port, () => {
  console.log(`[admin-api] listening on http://localhost:${config.port}`);
});
