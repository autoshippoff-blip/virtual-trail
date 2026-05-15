import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const requestId = request.requestId || 'unknown';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: requestId,
      error: exception.message || 'Internal Server Error',
    };

    if (status >= 500) {
      this.logger.error({
        requestId,
        path: request.url,
        error: exception.message,
        stack: exception.stack,
      }, 'unhandled_exception');
    } else {
      this.logger.warn({
        requestId,
        path: request.url,
        error: exception.message,
      }, 'http_exception');
    }

    response.status(status).json({
      error: errorResponse.error,
      requestId: errorResponse.requestId,
    });
  }
}
