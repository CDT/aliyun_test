export type Role = 'admin' | 'user';

export interface DemoUser {
  id: string;
  username: string;
  password: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface SafeUser {
  id: string;
  username: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface HttpRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  rawBody: string;
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}
