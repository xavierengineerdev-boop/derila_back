import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
  details?: any;
}

export class CustomException extends HttpException {
  constructor(
    statusCode: HttpStatus,
    message: string | string[],
    error?: string,
    details?: any,
  ) {
    const defaultError = CustomException.getDefaultError(statusCode);
    const response: ErrorResponse = {
      statusCode,
      message,
      error: error || defaultError,
      timestamp: new Date().toISOString(),
    };

    if (details) {
      response.details = details;
    }

    super(response, statusCode);
  }

  private static getDefaultError(statusCode: number): string {
    const errorMap: Record<number, string> = {
      200: 'Success',
      201: 'Created',
      204: 'No Content',
      300: 'Multiple Choices',
      301: 'Moved Permanently',
      302: 'Found',
      304: 'Not Modified',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };

    return errorMap[statusCode] || 'Error';
  }
}

// 2xx - Success (редко используются как ошибки, но для полноты)
export class SuccessException extends CustomException {
  constructor(message: string, details?: any) {
    super(HttpStatus.OK, message, 'Success', details);
  }
}

// 3xx - Redirection
export class RedirectException extends CustomException {
  constructor(message: string, details?: any) {
    super(HttpStatus.MOVED_PERMANENTLY, message, 'Redirect', details);
  }
}

// 4xx - Client Errors
export class BadRequestException extends CustomException {
  constructor(message: string | string[], details?: any) {
    super(HttpStatus.BAD_REQUEST, message, 'Bad Request', details);
  }
}

export class UnauthorizedException extends CustomException {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(HttpStatus.UNAUTHORIZED, message, 'Unauthorized', details);
  }
}

export class ForbiddenException extends CustomException {
  constructor(message: string = 'Forbidden', details?: any) {
    super(HttpStatus.FORBIDDEN, message, 'Forbidden', details);
  }
}

export class NotFoundException extends CustomException {
  constructor(message: string = 'Resource not found', details?: any) {
    super(HttpStatus.NOT_FOUND, message, 'Not Found', details);
  }
}

export class ConflictException extends CustomException {
  constructor(message: string, details?: any) {
    super(HttpStatus.CONFLICT, message, 'Conflict', details);
  }
}

export class UnprocessableEntityException extends CustomException {
  constructor(message: string | string[], details?: any) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      message,
      'Unprocessable Entity',
      details,
    );
  }
}

export class TooManyRequestsException extends CustomException {
  constructor(message: string = 'Too many requests', details?: any) {
    super(
      HttpStatus.TOO_MANY_REQUESTS,
      message,
      'Too Many Requests',
      details,
    );
  }
}

// 5xx - Server Errors
export class InternalServerErrorException extends CustomException {
  constructor(message: string = 'Internal server error', details?: any) {
    super(
      HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      'Internal Server Error',
      details,
    );
  }
}

export class BadGatewayException extends CustomException {
  constructor(message: string = 'Bad gateway', details?: any) {
    super(HttpStatus.BAD_GATEWAY, message, 'Bad Gateway', details);
  }
}

export class ServiceUnavailableException extends CustomException {
  constructor(message: string = 'Service unavailable', details?: any) {
    super(
      HttpStatus.SERVICE_UNAVAILABLE,
      message,
      'Service Unavailable',
      details,
    );
  }
}

export class GatewayTimeoutException extends CustomException {
  constructor(message: string = 'Gateway timeout', details?: any) {
    super(HttpStatus.GATEWAY_TIMEOUT, message, 'Gateway Timeout', details);
  }
}

