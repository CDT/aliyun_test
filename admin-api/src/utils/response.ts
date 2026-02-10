import { HttpResponse } from '../types';

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export const ok = <T>(data: T, message = 'success'): ApiResponse<T> => ({
  code: 0,
  data,
  message,
});

export const fail = (message: string, code = 1, data: unknown = null): ApiResponse<unknown> => ({
  code,
  data,
  message,
});

export const toHttpResponse = (
  statusCode: number,
  payload: ApiResponse<unknown>,
  headers: Record<string, string> = {},
): HttpResponse => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  },
  body: JSON.stringify(payload),
});
