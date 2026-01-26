import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorUtil } from '../utils/error.util';
import { ErrorResponse } from '../exceptions/custom-exceptions';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Если ответ уже в формате ErrorResponse, используем его
    if (
      typeof exceptionResponse === 'object' &&
      'statusCode' in exceptionResponse
    ) {
      const errorResponse = exceptionResponse as ErrorResponse;
      errorResponse.path = request.url;
      if (!errorResponse.timestamp) {
        errorResponse.timestamp = new Date().toISOString();
      }
      return response.status(status).json(errorResponse);
    }

    // Иначе форматируем стандартным способом
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || exception.message;

    const errorResponse = ErrorUtil.formatErrorResponse(
      status,
      message,
      request.url,
    );

    response.status(status).json(errorResponse);
  }
}

