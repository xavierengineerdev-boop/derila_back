import { HttpStatus } from '@nestjs/common';
import { CustomException, ErrorResponse } from '../exceptions/custom-exceptions';

export class ErrorUtil {
  static createError(
    statusCode: number,
    message: string | string[],
    error?: string,
    details?: any,
  ): CustomException {
    return new CustomException(
      statusCode as HttpStatus,
      message,
      error,
      details,
    );
  }

  static formatErrorResponse(
    statusCode: number,
    message: string | string[],
    path?: string,
    details?: any,
  ): ErrorResponse {
    return {
      statusCode,
      message,
      error: this.getDefaultError(statusCode),
      timestamp: new Date().toISOString(),
      path,
      ...(details && { details }),
    };
  }

  static getDefaultError(statusCode: number): string {
    const errorMap: Record<number, string> = {
      200: 'Success',
      201: 'Created',
      204: 'No Content',

      300: 'Multiple Choices',
      301: 'Moved Permanently',
      302: 'Found',
      304: 'Not Modified',
      307: 'Temporary Redirect',
      308: 'Permanent Redirect',

      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      406: 'Not Acceptable',
      409: 'Conflict',
      410: 'Gone',
      411: 'Length Required',
      412: 'Precondition Failed',
      413: 'Payload Too Large',
      414: 'URI Too Long',
      415: 'Unsupported Media Type',
      416: 'Range Not Satisfiable',
      417: 'Expectation Failed',
      422: 'Unprocessable Entity',
      423: 'Locked',
      424: 'Failed Dependency',
      425: 'Too Early',
      426: 'Upgrade Required',
      428: 'Precondition Required',
      429: 'Too Many Requests',
      431: 'Request Header Fields Too Large',
      451: 'Unavailable For Legal Reasons',

      500: 'Internal Server Error',
      501: 'Not Implemented',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
      505: 'HTTP Version Not Supported',
      506: 'Variant Also Negotiates',
      507: 'Insufficient Storage',
      508: 'Loop Detected',
      510: 'Not Extended',
      511: 'Network Authentication Required',
    };

    return errorMap[statusCode] || 'Unknown Error';
  }

  static isClientError(statusCode: number): boolean {
    return statusCode >= 400 && statusCode < 500;
  }

  static isServerError(statusCode: number): boolean {
    return statusCode >= 500 && statusCode < 600;
  }

  static isSuccess(statusCode: number): boolean {
    return statusCode >= 200 && statusCode < 300;
  }

  static isRedirect(statusCode: number): boolean {
    return statusCode >= 300 && statusCode < 400;
  }
}


