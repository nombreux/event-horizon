export enum ErrorType {
  RETRYABLE = 'RETRYABLE',
  NON_RETRYABLE = 'NON_RETRYABLE',
  VALIDATION = 'VALIDATION',
  CONNECTION = 'CONNECTION',
  TIMEOUT = 'TIMEOUT'
}

export class BaseError extends Error {
  constructor(
    message: string,
    public readonly type: ErrorType,
    public readonly originalError?: Error,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class MessageProcessingError extends BaseError {
  constructor(
    message: string,
    type: ErrorType,
    originalError?: Error,
    metadata?: Record<string, unknown>
  ) {
    super(message, type, originalError, metadata);
  }
}

export class KafkaConnectionError extends BaseError {
  constructor(message: string, originalError?: Error) {
    super(message, ErrorType.CONNECTION, originalError);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, ErrorType.VALIDATION, undefined, metadata);
  }
}

export class HandlerRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HandlerRegistrationError';
  }
}