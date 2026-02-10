export class HttpError extends Error {
  statusCode: number;
  code: number;

  constructor(message: string, statusCode = 400, code = 1) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
