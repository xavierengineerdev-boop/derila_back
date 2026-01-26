// Примеры использования утилиты для ошибок

import { ErrorUtil } from './error.util';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
  TooManyRequestsException,
  BadGatewayException,
  ServiceUnavailableException,
  GatewayTimeoutException,
} from '../exceptions/custom-exceptions';

/**
 * Примеры использования утилиты для создания ошибок
 */
export class ErrorExamples {
  // 400 - Bad Request
  static badRequest(message: string, details?: any) {
    return new BadRequestException(message, details);
    // или
    // return ErrorUtil.createError(400, message, 'Bad Request', details);
  }

  // 401 - Unauthorized
  static unauthorized(message: string = 'Unauthorized', details?: any) {
    return new UnauthorizedException(message, details);
  }

  // 403 - Forbidden
  static forbidden(message: string = 'Forbidden', details?: any) {
    return new ForbiddenException(message, details);
  }

  // 404 - Not Found
  static notFound(resource: string = 'Resource', details?: any) {
    return new NotFoundException(`${resource} not found`, details);
  }

  // 409 - Conflict
  static conflict(message: string, details?: any) {
    return new ConflictException(message, details);
  }

  // 422 - Unprocessable Entity
  static unprocessableEntity(
    message: string | string[],
    details?: any,
  ) {
    return new UnprocessableEntityException(message, details);
  }

  // 429 - Too Many Requests
  static tooManyRequests(message: string = 'Too many requests', details?: any) {
    return new TooManyRequestsException(message, details);
  }

  // 500 - Internal Server Error
  static internalServerError(
    message: string = 'Internal server error',
    details?: any,
  ) {
    return new InternalServerErrorException(message, details);
  }

  // 502 - Bad Gateway
  static badGateway(message: string = 'Bad gateway', details?: any) {
    return new BadGatewayException(message, details);
  }

  // 503 - Service Unavailable
  static serviceUnavailable(
    message: string = 'Service unavailable',
    details?: any,
  ) {
    return new ServiceUnavailableException(message, details);
  }

  // 504 - Gateway Timeout
  static gatewayTimeout(message: string = 'Gateway timeout', details?: any) {
    return new GatewayTimeoutException(message, details);
  }

  // Универсальный метод
  static custom(statusCode: number, message: string, details?: any) {
    return ErrorUtil.createError(statusCode, message, undefined, details);
  }
}


