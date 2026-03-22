export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',
  CONFLICT = 'CONFLICT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}
